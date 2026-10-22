"""Optional pinned LOCAL development prerequisites. No installer/global configuration.

Only synthetic/trusted documents may use this PDFium experiment. Exact build source
revision and full production redistribution review remain gates; read OSS_LICENSE_AUDIT.
"""
import argparse
import hashlib
from pathlib import Path
import tarfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / ".tools"
ARTIFACTS = {
    "rust": ("rust-1.99.1-gnu.tar.xz", "https://static.rust-lang.org/dist/2026-10-15/rust-1.99.1-x86_64-pc-windows-gnu.tar.xz", "0210624b2eb2bdf4ec32c2a6caf5c3bd2ab84e5df66c7530023e37f02add1084"),
    "llvm": ("llvm-mingw-20261020-msvcrt-x86_64.zip", "https://github.com/mstorsjo/llvm-mingw/releases/download/20261020/llvm-mingw-20261020-msvcrt-x86_64.zip", "52a3e3f584a74c3cde8ceb0c6960549683178e03b36818cb02b7ed109a68ff67"),
    "pdfium": ("pypdfium2-5.14.0-win_amd64.whl", "https://files.pythonhosted.org/packages/00/dc/ca7874924c9cfd701ad53f89529968523790e70473e0b71e834668316148/pypdfium2-5.14.0-py3-none-win_amd64.whl", "149fd5c6397b8df8bf7911a93506eff0be874f877afe7ac936cf5d37d21a6a06"),
}


def download(kind):
    name, url, expected = ARTIFACTS[kind]
    TOOLS.mkdir(exist_ok=True)
    archive = TOOLS / name
    if not archive.exists():
        print("Downloading", name, flush=True)
        with urllib.request.urlopen(url, timeout=120) as response, archive.open("xb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
    with archive.open("rb") as handle:
        actual = hashlib.file_digest(handle, "sha256").hexdigest()
    if actual != expected:
        raise ValueError(f"Digest mismatch for {name}; remove invalid cache explicitly before retry")
    print("SHA256 verified", name, flush=True)
    return archive


def extract_zip(archive, destination):
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(archive) as source:
        for name in source.namelist():
            if not (destination / name).resolve().is_relative_to(destination.resolve()):
                raise ValueError("Archive path escapes destination")
        source.extractall(destination)


def extract_rust(archive):
    destination = TOOLS / "rust"
    components = {"rustc", "cargo", "rust-std-x86_64-pc-windows-gnu", "rust-mingw", "clippy-preview", "rustfmt-preview"}
    # Copy required components only. The complete archive's HTML documentation is
    # intentionally not extracted into a synced checkout.
    with tarfile.open(archive, "r:xz") as source:
        for item in source:
            parts = Path(item.name).parts
            if len(parts) < 3 or parts[1] not in components or not item.isfile():
                continue
            relative = Path(*parts[2:])
            if relative.parts[0] not in {"bin", "lib", "libexec", "etc", "share"}:
                continue
            if relative.parts[0] == "share" and not any(term in str(relative).lower() for term in ["license", "copyright", "notice"]):
                continue
            target = (destination / relative).resolve()
            if not target.is_relative_to(destination.resolve()):
                raise ValueError("Rust archive path escapes destination")
            target.parent.mkdir(parents=True, exist_ok=True)
            stream = source.extractfile(item)
            with stream, target.open("wb") as output:
                while chunk := stream.read(1024 * 1024):
                    output.write(chunk)


def extract_llvm_dlltool(archive):
    # Rust's bundled GNU dlltool requires an external assembler; LLVM's import
    # library generator does not. Extract only this Apache/LLVM-exception tool,
    # its DLLs and license files. GPL make/gendef are not used or extracted.
    binaries = {"dlltool.exe", "libLLVM-23.dll", "libc++.dll", "libunwind.dll"}
    with zipfile.ZipFile(archive) as source:
        for name in source.namelist():
            parts = Path(name).parts
            if len(parts) < 3:
                continue
            selected = parts[1] == "bin" and parts[-1] in binaries
            selected |= parts[1] == "share" and any(k in name.lower() for k in ["license", "copying", "copyright"]) and not any(k in name.lower() for k in ["/make/", "/gendef/"])
            if selected:
                if not (TOOLS/name).resolve().is_relative_to(TOOLS.resolve()):
                    raise ValueError("LLVM archive path escapes destination")
                source.extract(name, TOOLS)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--toolchain", action="store_true", help="pinned Rust GNU + LLVM dlltool subset (~473MB compressed); no global setup")
    parser.add_argument("--pdfium", action="store_true", help="download/extract exact local experiment DLL with license bundle")
    args = parser.parse_args()
    if not (args.toolchain or args.pdfium):
        parser.error("select --toolchain and/or --pdfium explicitly")
    if args.toolchain:
        extract_rust(download("rust"))
        extract_llvm_dlltool(download("llvm"))
    if args.pdfium:
        extract_zip(download("pdfium"), TOOLS / "pdfium")
    print("Prepared ignored .tools artifacts. Read docs/PHASE0_RUNBOOK.md before use.")


if __name__ == "__main__":
    main()
