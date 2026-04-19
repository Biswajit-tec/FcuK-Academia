#!/usr/bin/env python3
import os
import sys
import json
import re
from pathlib import Path
from typing import Optional, Dict, Any

# Root setup for dependencies in .python-packages
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".python-packages"))

import httpx

# --- CONFIGURATION ---
MY_NOTES_DIR = ROOT / "MyNotes"
BUCKET_NAME = "pyqs"
API_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
API_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

# 50MB limit for Supabase Storage free tier
MAX_FILE_SIZE = 50 * 1024 * 1024 
DEFAULT_TIMEOUT = 300.0 # 5 minutes

if not API_URL or not API_KEY:
    # Attempt to load from .env.local if not in environment
    try:
        with open(ROOT / ".env.local", "r") as f:
            for line in f:
                if line.startswith("NEXT_PUBLIC_SUPABASE_URL="):
                    API_URL = line.split("=")[1].strip().strip('"')
                if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                    API_KEY = line.split("=")[1].strip().strip('"')
    except FileNotFoundError:
        pass

if not API_URL or not API_KEY:
    print("Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing.")
    sys.exit(1)

# API Headers
HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# --- HEURISTICS ---
PYQ_KEYWORDS = ["pyq", "question paper", "university paper", "end sem"]
CT_KEYWORDS = ["ct", "cycle test", "test 1", "test 2", "sessional"]
NOTE_KEYWORDS = ["note", "unit", "chapter", "lecture", "tutorial"]

def categorize_file(filename: str) -> str:
    name_low = filename.lower()
    if any(k in name_low for k in PYQ_KEYWORDS):
        return "PYQ"
    if any(k in name_low for k in CT_KEYWORDS):
        return "CT"
    if any(k in name_low for k in NOTE_KEYWORDS):
        return "Note"
    return "Note" # Default

def extract_year(filename: str) -> Optional[int]:
    match = re.search(r"(20\d{2})", filename)
    if match:
        return int(match.group(1))
    return None

# --- SUPABASE WRAPPERS ---

def check_db_duplicate(semester: int, subject: str, label: str):
    url = f"{API_URL}/rest/v1/pyqs?semester=eq.{semester}&subject_name=eq.{subject}&source_label=eq.{label}&select=id"
    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        resp = client.get(url, headers=HEADERS)
        if resp.status_code == 200:
            data = resp.json()
            return len(data) > 0
    return False

def upload_to_storage(local_path: Path, remote_path: str):
    # Supabase Storage v1 API: POST /storage/v1/object/{bucket}/{path}
    url = f"{API_URL}/storage/v1/object/{BUCKET_NAME}/{remote_path}"
    
    # Check if exists first
    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        # Check metadata
        check_url = f"{API_URL}/storage/v1/object/info/public/{BUCKET_NAME}/{remote_path}"
        info_resp = client.get(check_url, headers=HEADERS)
        if info_resp.status_code == 200:
            print(f"  [Skip] File already exists in storage: {remote_path}")
            return f"{API_URL}/storage/v1/object/public/{BUCKET_NAME}/{remote_path}"

        # Size check
        file_size = os.path.getsize(local_path)
        if file_size > MAX_FILE_SIZE:
            raise ValueError(f"Payload too large: {file_size / (1024*1024):.2f}MB > 50MB limit")

        # Upload
        print(f"  [Upload] {local_path.name} -> {remote_path}")
        content_type = "application/pdf" if local_path.suffix == ".pdf" else "application/octet-stream"
        with open(local_path, "rb") as f:
            upload_headers = {
                "apikey": API_KEY,
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": content_type,
                "x-upsert": "false"
            }
            resp = client.post(url, headers=upload_headers, content=f.read())
            if resp.status_code in [200, 201]:
                return f"{API_URL}/storage/v1/object/public/{BUCKET_NAME}/{remote_path}"
            else:
                raise Exception(f"Upload failed with {resp.status_code}: {resp.text}")

def insert_record(data: Dict[str, Any]):
    url = f"{API_URL}/rest/v1/pyqs"
    with httpx.Client(timeout=DEFAULT_TIMEOUT) as client:
        resp = client.post(url, headers=HEADERS, json=data)
        if resp.status_code in [201, 204, 200]:
            return True
        else:
            raise Exception(f"DB insertion failed with {resp.status_code}: {resp.text}")

# --- MAIN SYNC ---

def sync():
    if not MY_NOTES_DIR.exists():
        print(f"Error: {MY_NOTES_DIR} does not exist.")
        return

    print(f"Starting sync from {MY_NOTES_DIR}...")
    
    stats = {
        "success": 0,
        "error": 0,
        "skipped": 0
    }

    # Walk through semesters
    for sem_dir in sorted(MY_NOTES_DIR.iterdir()):
        if not sem_dir.is_dir() or not sem_dir.name.isdigit():
            continue
        
        semester = int(sem_dir.name)
        print(f"\nProcessing Semester {semester}")

        # Walk through subjects
        for sub_dir in sorted(sem_dir.iterdir()):
            if not sub_dir.is_dir():
                continue
            
            subject_name = sub_dir.name
            print(f"  Subject: {subject_name}")

            # Walk through files
            for file_path in sorted(sub_dir.iterdir()):
                if not file_path.is_file() or file_path.name.startswith("."):
                    continue
                
                filename = file_path.name
                label = file_path.stem
                exam_type = categorize_file(filename)
                year = extract_year(filename)
                
                print(f"    - File: {filename} [{exam_type}, {year or 'No Year'}]")

                try:
                    # 1. Check DB Duplicate
                    if check_db_duplicate(semester, subject_name, label):
                        print(f"      [Skip] DB record already exists.")
                        stats["skipped"] += 1
                        continue

                    # 2. Upload to Storage
                    safe_subject = subject_name.replace(" ", "_").replace("&", "and")
                    safe_filename = filename.replace(" ", "_")
                    remote_path = f"{semester}/{safe_subject}/{safe_filename}"
                    
                    file_url = upload_to_storage(file_path, remote_path)
                    
                    if not file_url:
                        # This case is usually handled by exceptions now, but for safety:
                        stats["error"] += 1
                        continue

                    # 3. Insert into DB
                    record = {
                        "semester": semester,
                        "subject_name": subject_name,
                        "exam_type": exam_type,
                        "year": year,
                        "source_label": label,
                        "file_url": file_url
                    }
                    
                    if insert_record(record):
                        print(f"      [Success] Added to database.")
                        stats["success"] += 1
                
                except Exception as e:
                    print(f"      [Error] {str(e)}")
                    stats["error"] += 1

    print("\n" + "="*40)
    print("SYNC COMPLETE - FINAL SUMMARY")
    print("="*40)
    print(f"Total Successful Uploads: {stats['success']}")
    print(f"Total Files Skipped:     {stats['skipped']}")
    print(f"Total Errors Encountered: {stats['error']}")
    print("="*40)


if __name__ == "__main__":
    sync()
