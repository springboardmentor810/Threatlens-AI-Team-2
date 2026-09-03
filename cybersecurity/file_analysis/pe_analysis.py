import pefile


def analyze_pe(file_path):
    """
    Perform static PE analysis on an EXE or DLL.
    """

    try:
        pe = pefile.PE(file_path)

        # -------------------------
        # PE HEADERS
        # -------------------------

        headers = {
            "machine": hex(pe.FILE_HEADER.Machine),
            "number_of_sections":
                pe.FILE_HEADER.NumberOfSections,
            "timestamp":
                pe.FILE_HEADER.TimeDateStamp,
            "entry_point":
                hex(pe.OPTIONAL_HEADER.AddressOfEntryPoint),
            "image_base":
                hex(pe.OPTIONAL_HEADER.ImageBase),
        }

        # -------------------------
        # SECTIONS
        # -------------------------

        sections = []

        for section in pe.sections:

            name = section.Name.decode(
                "utf-8",
                errors="ignore"
            ).rstrip("\x00")

            sections.append({
                "name": name,
                "virtual_address":
                    hex(section.VirtualAddress),
                "virtual_size":
                    section.Misc_VirtualSize,
                "raw_size":
                    section.SizeOfRawData,
                "characteristics":
                    hex(section.Characteristics),
            })

        # -------------------------
        # SUSPICIOUS CHARACTERISTICS
        # -------------------------

        suspicious_characteristics = []

        for section in pe.sections:

            name = section.Name.decode(
                "utf-8",
                errors="ignore"
            ).rstrip("\x00")

            characteristics = section.Characteristics

            # IMAGE_SCN_MEM_EXECUTE
            executable = bool(
                characteristics & 0x20000000
            )

            # IMAGE_SCN_MEM_WRITE
            writable = bool(
                characteristics & 0x80000000
            )

            if executable and writable:

                suspicious_characteristics.append({
                    "section": name,
                    "reason":
                        "Section is both writable and executable"
                })

        result = {
            "headers": headers,
            "sections": sections,
            "suspicious_characteristics":
                suspicious_characteristics,
        }

        pe.close()

        return result

    except pefile.PEFormatError:

        return {
            "headers": {},
            "sections": [],
            "suspicious_characteristics": []
        }