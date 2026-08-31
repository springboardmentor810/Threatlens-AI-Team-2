rule Suspicious_PE_File
{
    meta:
        description = "Detects basic suspicious characteristics in Windows PE files"
        author = "ThreatLens AI Team"
        severity = "medium"

    strings:
        $mz = { 4D 5A }
        $pe = "This program cannot be run in DOS mode"

    condition:
        $mz at 0 and $pe
}