import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase app
cred = credentials.Certificate('serviceAccountKey.json')  # Use your updated key
firebase_admin.initialize_app(cred)
db = firestore.client()

# Sample invoice data (6 invoices)
invoices = [
    {
        "student_id": "STU2025001",
        "invoice_number": "INV-202504-1",
        "month": "April 2025",
        "amount": 9500,
        "due_date": "2025-04-30",
        "status": "paid",
        "payment_id": "pay_Ql69aZaoYSuP5b",
        "payment_date": datetime(2025, 4, 10, 12, 0, 0)
    },
    {
        "student_id": "STU2025001",
        "invoice_number": "INV-202505-2",
        "month": "May 2025",
        "amount": 9500,
        "due_date": "2025-05-30",
        "status": "pending",
        "payment_id": "",
        "payment_date": None
    },
    {
        "student_id": "STU2025001",
        "invoice_number": "INV-202506-3",
        "month": "June 2025",
        "amount": 9500,
        "due_date": "2025-06-30",
        "status": "pending",
        "payment_id": "",
        "payment_date": None
    },
    {
        "student_id": "STU2025002",
        "invoice_number": "INV-202504-4",
        "month": "April 2025",
        "amount": 9000,
        "due_date": "2025-04-30",
        "status": "paid",
        "payment_id": "pay_Abc123XYZ",
        "payment_date": datetime(2025, 4, 12, 10, 30, 0)
    },
    {
        "student_id": "STU2025002",
        "invoice_number": "INV-202505-5",
        "month": "May 2025",
        "amount": 9000,
        "due_date": "2025-05-30",
        "status": "paid",
        "payment_id": "pay_Def456UVW",
        "payment_date": datetime(2025, 5, 15, 14, 45, 0)
    },
    {
        "student_id": "STU2025002",
        "invoice_number": "INV-202506-6",
        "month": "June 2025",
        "amount": 9000,
        "due_date": "2025-06-30",
        "status": "pending",
        "payment_id": "",
        "payment_date": None
    }
]

# Updated student data using parent_contacts array
students = [
    {
        "student_id": "STU2025001",
        "name": "Rahul Sharma",
        "grade": "Grade 5",
        "parent_name": "Priya Sharma",
        "parent_contacts": ["1234567890"],
        "email": "priya@example.com",
        "joined_date": datetime(2023, 6, 1),
        "father_name": "Rahul Sharma",
        "father_contact": "1234567890",
        "mother_name": "Priya Sharma",
        "mother_contact": "1234567890",
        "address": "123, 1st street, hyderabad",
        "profile_image": "",
        "dob": "2013-07-15",
        "blood_group": "A+",
        "nick_name": "Rahi"
    },
    {
        "student_id": "STU2025002",
        "name": "Anita Verma",
        "grade": "Grade 4",
        "parent_name": "Sunil Verma",
        "parent_contacts": ["9876543210"],
        "email": "sunil@example.com",
        "joined_date": datetime(2024, 1, 15),
        "father_name": "Sunil Verma",
        "father_contact": "9876543210",
        "mother_name": "Anita Verma",
        "mother_contact": "9876543210",
        "address": "456, 2nd avenue, mumbai",
        "profile_image": "",
        "dob": "2014-11-02",
        "blood_group": "B+",
        "nick_name": "Ani"
    },
    {
        "student_id": "STU2025003",
        "name": "Vikram Patel",
        "grade": "Grade 3",
        "parent_name": "Neha Patel",
        "parent_contacts": ["8765432109"],
        "email": "neha@example.com",
        "joined_date": datetime(2024, 3, 10),
        "father_name": "Vikram Patel",
        "father_contact": "8765432109",
        "mother_name": "Neha Patel",
        "mother_contact": "8765432109",
        "address": "789, 3rd road, delhi",
        "profile_image": "",
        "dob": "2015-05-20",
        "blood_group": "O+",
        "nick_name": "Vicky"
    }
]

# Holidays
holidays = [
    {"date": "2025-02-26", "occasion": "Maha Shivaratri"},
    {"date": "2025-03-14", "occasion": "Holi"},
    {"date": "2025-03-31", "occasion": "Eid Ul Fitr (Ramzan)"},
    {"date": "2025-04-14", "occasion": "Dr. B.R. Ambedkar's Birthday"},
    {"date": "2025-04-18", "occasion": "Good Friday"},
    {"date": "2025-05-01", "occasion": "May Day"},
    {"date": "2025-06-02", "occasion": "Telangana Formation Day"},
    {"date": "2025-06-06", "occasion": "Eid-ul-Azha (Bakrid)"},
    {"date": "2025-07-21", "occasion": "Bonalu"},
    {"date": "2025-08-08", "occasion": "Varalakshmi Vratam"},
    {"date": "2025-08-15", "occasion": "Independence Day"},
    {"date": "2025-08-27", "occasion": "Vinayaka Chavithi"},
    {"date": "2025-09-05", "occasion": "Eid Milad-un-Nabi"},
    {"date": "2025-09-09", "occasion": "Durgashtami"},
    {"date": "2025-10-02", "occasion": "Mahatma Gandhi Jayanthi"},
    {"date": "2025-10-03", "occasion": "Dasara"},
    {"date": "2025-10-20", "occasion": "Deepavali"},
    {"date": "2025-11-05", "occasion": "Kartika Purnima"},
    {"date": "2025-12-25", "occasion": "Christmas"},
    {"date": "2025-12-26", "occasion": "Following Day of Christmas"},
]

# Attendance
attendance_data = [
    {
        "student_id": "STU2025001",
        "date": "2025-05-01",
        "status": "present",
        "time_in": "8:00 AM",
        "time_out": "1:00 PM",
        "grade": "A"
    },
    {
        "student_id": "STU2025001",
        "date": "2025-05-02",
        "status": "leave",
        "reason": "Sick leave"
    },
    {
        "student_id": "STU2025001",
        "date": "2025-05-03",
        "status": "holiday",
        "holiday_name": "Independence Day"
    }
]

# Firestore Import Functions
def add_invoices(invoices):
    batch = db.batch()
    invoices_ref = db.collection('invoices')
    for invoice in invoices:
        doc_ref = invoices_ref.document(invoice['invoice_number'])
        if invoice.get('payment_date') and isinstance(invoice['payment_date'], datetime):
            invoice['payment_date'] = firestore.SERVER_TIMESTAMP
        batch.set(doc_ref, invoice)
    batch.commit()
    print(f"✅ Added {len(invoices)} invoices")

def add_students(students):
    batch = db.batch()
    students_ref = db.collection('students')
    for student in students:
        doc_ref = students_ref.document(student['student_id'])
        if student.get('joined_date') and isinstance(student['joined_date'], datetime):
            student['joined_date'] = firestore.SERVER_TIMESTAMP
        batch.set(doc_ref, student)
    batch.commit()
    print(f"✅ Added {len(students)} students")

def add_holidays(holidays):
    batch = db.batch()
    holidays_ref = db.collection('holidays')
    for holiday in holidays:
        doc_ref = holidays_ref.document(holiday['date'])
        batch.set(doc_ref, holiday)
    batch.commit()
    print(f"✅ Added {len(holidays)} holidays")

def add_attendance_records(records):
    batch = db.batch()
    attendance_ref = db.collection('attendance_records')
    for record in records:
        doc_id = f"{record['student_id']}_{record['date']}"
        doc_ref = attendance_ref.document(doc_id)
        batch.set(doc_ref, record)
    batch.commit()
    print(f"✅ Added {len(records)} attendance records")

# Run all imports
if __name__ == "__main__":
    add_invoices(invoices)
    add_students(students)
    add_attendance_records(attendance_data)
    add_holidays(holidays)
    print("🎉 All data imported successfully!")
