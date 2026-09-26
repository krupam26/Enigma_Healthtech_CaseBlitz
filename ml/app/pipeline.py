from datetime import date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from app.extraction import extract_prescription
from app.normalization import normalize_prescription
from app.safety import run_safety_checks


def process_prescription(image_path: str):

    extraction = extract_prescription(image_path)

    extraction = normalize_prescription(extraction)

    safety_alerts = run_safety_checks(
        extraction.medications
    )

    return {
        "prescription": extraction.model_dump(),
        "safety_alerts": safety_alerts
    }


def generate_dose_events(
    medications,
    start_date: date,
    days: int = 1,
    user_timezone: str = "UTC"
):
    events = []
    period_hours = {
        "morning": 8,
        "afternoon": 13,
        "evening": 20
    }

    try:
        local_timezone = ZoneInfo(user_timezone)
    except Exception as error:
        raise ValueError("user_timezone must be a valid IANA timezone") from error

    for medication in medications:
        if medication.requires_verification or medication.schedule_type == "PRN":
            continue

        schedule_times = medication.schedule_times or []
        if not schedule_times and medication.timing:
            schedule_times = [medication.timing]
        if not schedule_times:
            continue

        phases = medication.schedule_phases or [{
            "start_day": 1,
            "end_day": days,
            "dose": medication.dose
        }]

        for offset in range(days):
            current_date = start_date + timedelta(days=offset)
            for schedule in schedule_times:
                period = schedule.lower()
                if period not in period_hours:
                    period = "morning"
                scheduled_time = datetime.combine(
                    current_date,
                    time(period_hours[period], 0)
                ).replace(tzinfo=local_timezone)
                phase = next(
                    (
                        phase for phase in phases
                        if phase.get("start_day", 1) <= offset + 1 <= phase.get("end_day", days)
                    ),
                    phases[-1]
                )
                events.append({
                    "patient_id": "unassigned",
                    "dose_id": "|".join([
                        "unassigned",
                        medication.name.strip().lower(),
                        scheduled_time.isoformat()
                    ]),
                    "medication": medication.name,
                    "scheduled_time": scheduled_time,
                    "period": period,
                    "status": "not_recorded",
                    "delay_hours": 0.0,
                    "day_of_week": current_date.strftime("%A"),
                    "dose": phase.get("dose")
                })

    return events


def prescription_to_adherence_events(
    extraction,
    start_date: date,
    days: int = 1,
    user_timezone: str = "UTC"
):
    normalized = normalize_prescription(extraction)
    safety_alerts = run_safety_checks(normalized.medications)
    events = generate_dose_events(
        normalized.medications,
        start_date,
        days,
        user_timezone
    )
    return {
        "prescription": normalized.model_dump(),
        "safety_alerts": safety_alerts,
        "events": events
    }