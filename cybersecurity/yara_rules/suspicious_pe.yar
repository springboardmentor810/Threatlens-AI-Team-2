rule Suspicious_PE_File
{
    meta:
        description = "Detects suspicious characteristics in Windows PE files"
        author = "ThreatLens AI Team"
        severity = "medium"

    strings:
        $mz = { 4D 5A }
        $pe = "This program cannot be run in DOS mode"
        $powershell = "powershell"
        $cmd = "cmd.exe"
        $download = "URLDownloadToFile"
        $write_memory = "WriteProcessMemory"

    condition:
        $mz at 0 and
        $pe and
        (
            $powershell or
            $cmd or
            $download or
            $write_memory
        )
}