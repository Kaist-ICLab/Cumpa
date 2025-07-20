import csv
import os
from datetime import datetime

PROFILE_CSV_FILE = 'cumpa_profile_log.csv'

def init_profile_csv():
    if not os.path.exists(PROFILE_CSV_FILE):
        with open(PROFILE_CSV_FILE, mode='w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow([
                "User Utterance", 
                "Step", 
                "Start Time", 
                "End Time", 
                "Elapsed(ms)"
            ])

def log_step(user_utterance: str, step: str, start_time: float, end_time: float):
    elapsed_ms = (end_time - start_time) * 1000
    start_ymd = datetime.fromtimestamp(start_time).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    end_ymd = datetime.fromtimestamp(end_time).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]

    with open(PROFILE_CSV_FILE, mode='a', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow([user_utterance, step, start_ymd, end_ymd, f"{elapsed_ms:.2f}"])

init_profile_csv()
