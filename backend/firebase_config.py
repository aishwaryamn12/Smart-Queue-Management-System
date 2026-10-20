import firebase_admin
from firebase_admin import credentials

# Firebase service account
cred = credentials.Certificate("firebase-service-account.json")

# Initialize Firebase
firebase_admin.initialize_app(cred)

print("Firebase Admin SDK connected successfully!")