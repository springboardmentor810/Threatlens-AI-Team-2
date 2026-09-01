from pathlib import Path
from typing import Any

import yara


class YaraScanner:
    """
    Scans files against the project's YARA rules.
    """

    def __init__(
        self,
        rules_directory: str | None = None
    ):
        if rules_directory:

            self.rules_directory = Path(
                rules_directory
            )

        else:

            self.rules_directory = (
                Path(__file__).resolve().parent
                / "yara_rules"
            )

    def load_rules(self) -> yara.Rules:
        """
        Compile all .yar and .yara rule files.
        """

        rule_files = list(
            self.rules_directory.glob("*.yar")
        )

        rule_files.extend(
            self.rules_directory.glob("*.yara")
        )

        if not rule_files:

            raise FileNotFoundError(
                "No YARA rule files found in "
                f"{self.rules_directory}"
            )

        rule_sources = {
            f"rule_{index}": str(rule_file)

            for index, rule_file in enumerate(
                rule_files
            )
        }

        return yara.compile(
            filepaths=rule_sources
        )

    def scan_file(
        self,
        file_path: str
    ) -> dict[str, Any]:
        """
        Scan a file and return structured
        YARA detection results.
        """

        path = Path(file_path)

        if not path.exists():

            raise FileNotFoundError(
                f"File not found: {file_path}"
            )

        rules = self.load_rules()

        matches = rules.match(
            str(path)
        )

        matched_rules = [
            {
                "rule": match.rule,

                "namespace": match.namespace,

                "tags": list(match.tags)
            }

            for match in matches
        ]

        return {
            "yara_matched": bool(matches),

            "matched_rules": matched_rules,

            "rule_count": len(matched_rules)
        }