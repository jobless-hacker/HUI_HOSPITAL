/**
 * HUI General Hospital - Static Data Payload
 * This acts as our "Database" for the Vanilla JS SPA.
 * The script.js file looks for window.HUIData on load.
 */

window.HUIData = {
  "hospital_overview_full_detailed": {
    "meta": {
      "id": "hui-hyderabad-2026-full",
      "name": "HUI General Hospital",
      "shortName": "HUI Hospital",
      "type": "Multi-Speciality Tertiary Care",
      "establishedYear": 1998,
      "registrationNumber": "TS-MED-REG-28473",
      "totalBeds": 420,
      "icuBeds": 56,
      "operationTheaters": 12,
      "annualOutpatients": 128540,
      "annualSurgeries": 8432,
      "emergencyAvailable": true,
      "primaryLanguage": "en-IN",
      "regionFocus": "Hyderabad / Telangana & Andhra Pradesh belt"
    },
    "contact": {
      "mainPhone": "+91-40-2345-6789",
      "appointmentDesk": "+91-40-2345-6799",
      "ambulance": "+91-98855-00110",
      "emailGeneral": "info@huigeneral.in",
      "emailAppointments": "appointments@huigeneral.in",
      "supportHours": "08:00-20:00 IST",
      "website": "https://www.huigeneral.in"
    },
    "addresses": [
      {
        "id": "addr-main",
        "label": "Main Campus",
        "line1": "Plot No. 45, Sainikpuri Main Road",
        "area": "Sainikpuri",
        "city": "Hyderabad",
        "district": "Medchal–Malkajgiri",
        "state": "Telangana",
        "pincode": "500094",
        "country": "India"
      }
    ],
    "departments": [
      {
        "id": "dep-01",
        "name": "Cardiology",
        "headDoctorId": "doc-021",
        "services": ["Interventional Cardiology", "Echocardiography", "Stress Testing", "Heart Failure Clinic", "Cardiac Rehab"],
        "description": "Full-spectrum cardiac services with 24x7 cath lab and cardiac ICU.",
        "workingHours": "24x7",
        "tags": ["24/7", "ICU", "Cath Lab"]
      },
      {
        "id": "dep-02",
        "name": "Neurology",
        "headDoctorId": "doc-034",
        "services": ["Stroke Unit", "EEG", "Neurophysiology", "Memory Clinic"],
        "description": "Acute stroke care, epilepsy clinic and neurorehabilitation programs.",
        "workingHours": "Mon-Fri 09:00-18:00",
        "tags": ["Stroke", "Rehab"]
      },
      {
        "id": "dep-03",
        "name": "Orthopedics",
        "headDoctorId": "doc-047",
        "services": ["Arthroplasty", "Trauma Surgery", "Arthroscopy", "Sports Medicine"],
        "description": "Joint replacement, trauma management and sports injury clinic with physiotherapy.",
        "workingHours": "Mon-Sat 09:00-17:00",
        "tags": ["Surgery", "Rehab"]
      },
      {
        "id": "dep-04",
        "name": "Pediatrics & Neonatology",
        "headDoctorId": "doc-061",
        "services": ["NICU", "PICU", "Newborn Care", "Immunization", "Pediatric Emergency Triage", "Pediatric Surgery Coordination"],
        "description": "Comprehensive child health services with pediatricians, neonatologists, NICU/PICU support, and newborn care.",
        "workingHours": "Mon-Sun 09:00-17:00",
        "tags": ["NICU", "PICU", "Pediatric Emergency", "Child Health"]
      },
      {
        "id": "dep-05",
        "name": "Oncology",
        "headDoctorId": "doc-089",
        "services": ["Medical Oncology", "Chemotherapy Day-care", "Palliative Care"],
        "description": "Integrated cancer care with tumor boards and multidisciplinary planning.",
        "workingHours": "Mon-Fri 09:00-17:00",
        "tags": ["Cancer Care"]
      },
      {
        "id": "dep-06",
        "name": "Radiology & Imaging",
        "headDoctorId": "doc-078",
        "services": ["MRI 3T", "CT 128-slice", "Ultrasound", "Interventional Radiology"],
        "description": "High-resolution imaging services with teleradiology reporting.",
        "workingHours": "Daily 06:00-22:00",
        "tags": ["Diagnostics", "Imaging"]
      },
      {
        "id": "dep-07",
        "name": "Emergency & Trauma",
        "headDoctorId": "doc-005",
        "services": ["Trauma Resuscitation", "Emergency Medicine", "Fast-Track OPD"],
        "description": "Dedicated emergency team with round-the-clock imaging and lab access.",
        "workingHours": "24x7",
        "tags": ["24/7", "ER"]
      }
    ],
    "doctors": [
      {
        "id": "doc-005",
        "name": "Dr. Suresh Reddy",
        "specialization": "Emergency Medicine",
        "qualification": "MBBS, MD (Emergency Medicine)",
        "experienceYears": 16,
        "languages": ["English", "Telugu", "Hindi"],
        "consultationFeeINR": 0,
        "tags": ["ER Head"]
      },
      {
        "id": "doc-021",
        "name": "Dr. Priya Nair",
        "specialization": "Interventional Cardiology",
        "qualification": "MBBS, MD, DM Cardiology",
        "experienceYears": 12,
        "languages": ["English", "Telugu", "Malayalam"],
        "consultationFeeINR": 900,
        "tags": ["Senior Consultant"]
      },
      {
        "id": "doc-034",
        "name": "Dr. Ravi Krishna",
        "specialization": "Neurology",
        "qualification": "MBBS, MD, DM Neurology",
        "experienceYears": 9,
        "languages": ["English", "Telugu"],
        "consultationFeeINR": 800,
        "tags": ["Stroke Specialist"]
      },
      {
        "id": "doc-047",
        "name": "Dr. Anjali Menon",
        "specialization": "Orthopedics",
        "qualification": "MBBS, MS Orthopedics",
        "experienceYears": 14,
        "languages": ["English", "Hindi", "Telugu"],
        "consultationFeeINR": 850,
        "tags": ["Surgeon"]
      },
      {
        "id": "doc-061",
        "name": "Dr. Kavya Iyer",
        "specialization": "Pediatrics & Neonatology",
        "qualification": "MBBS, MD Pediatrics",
        "experienceYears": 14,
        "languages": ["English", "Telugu", "Tamil"],
        "consultationFeeINR": 700,
        "tags": ["NICU Head"]
      },
      {
        "id": "doc-089",
        "name": "Dr. Sunil Varma",
        "specialization": "Medical Oncology",
        "qualification": "MBBS, MD Oncology",
        "experienceYears": 16,
        "languages": ["English", "Telugu"],
        "consultationFeeINR": 1100,
        "tags": ["Oncologist"]
      }
    ],
    "accreditations": [
      { "name": "NABH", "year": 2022, "id": "nabh-2022" },
      { "name": "ISO 9001:2015", "year": 2020, "id": "iso9001-2015" },
      { "name": "NABL", "year": 2021, "id": "nabl-2021" }
    ],
    "cmsContentBlocks": [
      {
        "slug": "hero",
        "title": "Hero - Trusted care in the heart of Hyderabad",
        "headline": "Trusted care in the heart of Hyderabad",
        "subhead": "Comprehensive clinical services backed by modern diagnostics and compassionate staff.",
        "ctaPrimary": "Book Appointment",
        "ctaSecondary": "Find a Doctor"
      }
    ],
    "sampleUiDataSlices": {
      "statsStrip": [
        { "label": "Patients Served", "value": 128540 },
        { "label": "Doctors on Roster", "value": 185 },
        { "label": "Beds", "value": 420 },
        { "label": "Departments", "value": 12 }
      ]
    },
    "appointmentFormTemplate": {
      "fields": [
        { "key": "departmentId", "type": "select", "label": "Department", "required": true },
        { "key": "doctorId", "type": "select", "label": "Preferred Doctor", "required": false },
        { "key": "patientName", "type": "text", "label": "Patient Name", "required": true },
        { "key": "patientAge", "type": "number", "label": "Age", "required": true, "min": 0, "max": 120 },
        { "key": "patientGender", "type": "select", "label": "Gender", "required": true, "options": ["Male", "Female", "Other"] },
        { "key": "contactPhone", "type": "tel", "label": "Contact Phone", "required": true, "pattern": "^\\+91\\s?\\d{10}$" },
        { "key": "preferredDate", "type": "date", "label": "Preferred Date", "required": false },
        { "key": "reason", "type": "textarea", "label": "Reason for Visit", "required": false, "maxlength": 600 },
        { "key": "consent", "type": "checkbox", "label": "I consent to the hospital contacting me for appointment confirmation", "required": true }
      ]
    }
  }
};
