import re


def extract_strings(file_path, min_length=4, max_strings=200):
    """
    Extract printable ASCII strings from a file.

    Returns a limited number of strings to prevent very large
    API responses while preserving useful static-analysis data.
    """

    with open(file_path, "rb") as file:
        data = file.read()

    pattern = rb"[\x20-\x7E]{%d,}" % min_length

    matches = re.findall(pattern, data)

    strings = [
        match.decode("ascii", errors="ignore")
        for match in matches
    ]

    # Remove duplicates while preserving original order
    unique_strings = list(dict.fromkeys(strings))

    return unique_strings[:max_strings]