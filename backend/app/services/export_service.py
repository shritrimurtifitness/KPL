import io
from datetime import datetime
import pytz
import pandas as pd
from sqlalchemy.orm import Session
from app.models.registration import Registration
from app.models.payment import Payment

KOLKATA_TZ = pytz.timezone("Asia/Kolkata")

class ExportService:
    @staticmethod
    def get_export_dataframe(db: Session) -> pd.DataFrame:
        registrations = (
            db.query(Registration)
            .outerjoin(Payment, Registration.id == Payment.registration_id)
            .order_by(Registration.created_at.desc())
            .all()
        )

        rows = []
        for reg in registrations:
            # Latest payment if any
            latest_payment = reg.payments[-1] if reg.payments else None
            
            # Convert UTC created_at to Asia/Kolkata
            created_str = ""
            if reg.created_at:
                local_time = reg.created_at.astimezone(KOLKATA_TZ)
                created_str = local_time.strftime("%d-%b-%Y %I:%M %p IST")

            rows.append({
                "Registration ID": reg.registration_id,
                "Player Name": reg.full_name,
                "Mobile": reg.mobile,
                "Email": reg.email or "N/A",
                "Age": reg.age,
                "City": reg.city,
                "Cricket Role": reg.cricket_role,
                "Batting Style": reg.batting_style or "N/A",
                "Bowling Style": reg.bowling_style or "N/A",
                "Team Name": reg.team_name or "N/A",
                "Registration Date": created_str,
                "Amount (INR)": float(reg.amount),
                "UTR / Reference": latest_payment.utr if latest_payment else "N/A",
                "Payment Status": latest_payment.status if latest_payment else "UNPAID",
                "Registration Status": reg.status,
            })

        return pd.DataFrame(rows)

    @staticmethod
    def generate_csv(db: Session) -> io.BytesIO:
        df = ExportService.get_export_dataframe(db)
        output = io.BytesIO()
        df.to_csv(output, index=False, encoding="utf-8-sig")
        output.seek(0)
        return output

    @staticmethod
    def generate_excel(db: Session) -> io.BytesIO:
        df = ExportService.get_export_dataframe(db)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Registrations")
        output.seek(0)
        return output
