import re


def extract_strings(file_path, min_length=4):
    """
    Extract printable ASCII strings from a file.
    """

    with open(file_path, "rb") as file:
        data = file.read()

    pattern = rb"[\x20-\x7E]{%d,}" % min_length

    matches = re.findall(pattern, data)

    strings = [
        match.decode(
            "ascii",
            errors="ignore"
        )
        for match in matches
    ]

    return strings