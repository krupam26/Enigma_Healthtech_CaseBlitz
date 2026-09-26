import requests
from datetime import date, datetime, timedelta


API_URL = "http://127.0.0.1:8000/ai/adherence-summary"


def create_events(
    medication,
    days,
    doses_per_day,
    missed_every,
    late_every,
    start_day=1
):
    events = []
    first_date = date(2026, 8, 1)

    for day in range(days):
        for dose in range(doses_per_day):

            if dose == 0:
                period = "morning"
                hour = 8
            elif dose == 1:
                period = "afternoon"
                hour = 13
            else:
                period = "evening"
                hour = 20

            current_date = first_date + timedelta(days=day + start_day - 1)
            day_number = day + start_day

            if missed_every and day_number % missed_every == 0:
                status = "missed_confirmed"
                delay_hours = 0

            elif late_every and day_number % late_every == 0:
                status = "taken_late"
                delay_hours = 2.5

            else:
                status = "taken"
                delay_hours = 0

            events.append({
                "patient_id": 1,
                "medication": medication,
                "scheduled_time": (
                    datetime.combine(
                        current_date,
                        datetime.min.time().replace(hour=hour)
                    ).isoformat()
                ),
                "period": period,
                "status": status,
                "delay_hours": delay_hours,
                "day_of_week": current_date.strftime("%A")
            })

    return events


profiles = {
    "GOOD": create_events(
        "Metformin",
        days=30,
        doses_per_day=2,
        missed_every=0,
        late_every=15
    ),

    "MODERATE": create_events(
        "Metformin",
        days=30,
        doses_per_day=1,
        missed_every=4,
        late_every=3
    ),

    "POOR": create_events(
        "Metformin",
        days=30,
        doses_per_day=2,
        missed_every=2,
        late_every=3
    )
}


for name, events in profiles.items():

    response = requests.post(
        API_URL,
        json={"events": events}
    )

    print("\n" + "=" * 60)
    print(name)
    print("=" * 60)

    print("Status:", response.status_code)

    if response.ok:
        data = response.json()

        print(
            "Adherence:",
            data["percentage"],
            "%"
        )

        print(
            "Support risk:",
            data["support_risk"].upper()
        )

        print(
            "Probabilities:",
            data["risk_probabilities"]
        )

    else:
        print(response.text)