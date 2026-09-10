from pathlib import Path
import sys

# Add project root to Python path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROJECT_ROOT))

from inference import generate_security_report


TEST_FILES = [
    r"C:\Windows\System32\notepad.exe",
    r"C:\Windows\System32\mspaint.exe",
    r"C:\Windows\System32\cmd.exe",
    r"C:\Windows\System32\write.exe",
    r"C:\Windows\System32\find.exe",
    r"C:\Windows\System32\hostname.exe",
    r"C:\Windows\System32\where.exe",
]


def main():
    print("=" * 100)
    print("SAFE WINDOWS PE REGRESSION TEST")
    print("=" * 100)

    for file_path in TEST_FILES:
        path = Path(file_path)

        print(f"\nFile: {path.name}")

        if not path.exists():
            print("Status: File not found")
            continue

        try:
            report = generate_security_report(
                str(path)
            )

            ml = report["ml_classification"]
            yara = report["yara_summary"]
            signature = report["file"]["signature"]

            print(
                f"Prediction: {ml['prediction']}"
            )
            print(
                f"Probability: "
                f"{ml['malware_probability']}"
            )
            print(
                f"Risk: {ml['risk_level']}"
            )
            print(
                f"Assessment: "
                f"{report['overall_assessment']}"
            )
            print(
                f"Signature: "
                f"{signature['status']}"
            )
            print(
                f"YARA matches: "
                f"{yara['match_count']}"
            )
            print(
                f"YARA severity: "
                f"{yara['highest_severity']}"
            )

        except Exception as e:
            print(f"ERROR: {e}")


if __name__ == "__main__":
    main()