from collections import Counter


def calculate_adherence(events):
    scheduled = len(events)

    if scheduled == 0:
        return 0.0

    taken = sum(
        1 for event in events
        if event.get("status") in ["taken", "taken_late"]
    )

    return round(taken / scheduled, 3)


def analyze_missed_patterns(events):
    missed = [
        event
        for event in events
        if event.get("status") == "missed"
    ]

    if not missed:
        return []


    patterns = []

    evening_missed = [
        event
        for event in missed
        if event.get("period") == "evening"
    ]

    if len(evening_missed) >= 2:
        patterns.append({
            "type": "evening_missed",
            "count": len(evening_missed),
            "message": (
                "Evening medication doses have been missed "
                "more frequently."
            )
        })


    reasons = Counter(
        event.get("reason")
        for event in missed
        if event.get("reason")
    )

    if reasons:
        common_reason, count = reasons.most_common(1)[0]

        if count >= 2:
            patterns.append({
                "type": "common_missed_reason",
                "reason": common_reason,
                "count": count,
                "message": (
                    f"The most frequently reported reason "
                    f"for missed doses is: {common_reason}."
                )
            })

    return patterns


def analyze_adherence(events):
    adherence = calculate_adherence(events)

    patterns = analyze_missed_patterns(events)

    return {
        "adherence": adherence,
        "percentage": round(adherence * 100, 1),
        "patterns": patterns
    }