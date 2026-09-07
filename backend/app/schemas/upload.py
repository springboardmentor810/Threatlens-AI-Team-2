from datetime import datetime

from pydantic import BaseModel


class FileInformation(BaseModel):
    filename: str
    extension: str
    file_type: str
    size: int


class ValidationResult(BaseModel):
    valid: bool
    extension: str
    size: int


class MetadataResult(BaseModel):
    filename: str
    extension: str
    file_type: str
    size: int
    created_time: str
    modified_time: str


class HashResult(BaseModel):
    md5: str
    sha256: str


class PESection(BaseModel):
    name: str
    virtual_address: str
    virtual_size: int
    raw_size: int
    characteristics: str


class PEAnalysis(BaseModel):
    headers: dict
    sections: list[PESection]
    suspicious_characteristics: list[str]


class ImportsResult(BaseModel):
    dlls: list[str]
    apis: list[str]


class StaticAnalysisResult(BaseModel):
    file: FileInformation
    validation: ValidationResult
    metadata: MetadataResult
    hashes: HashResult
    pe_analysis: PEAnalysis
    imports: ImportsResult
    strings: list[str]


class UploadResponse(BaseModel):
    message: str
    original_filename: str
    stored_filename: str
    file_size: int
    upload_time: datetime
    analysis: StaticAnalysisResult