# Python Worker compatibility probe

This is a local-only compatibility check. It is not the production API and
must not be deployed.

The candidate package versions reflect the Cloudflare Pyodide 3.14 package
set. They do not update the production API pins; any such upgrade requires
separate behavior and license review.

Run `uv run --group dev pywrangler dev` from this directory to start the local
Worker. In another terminal, run
`uv run --python 3.12 --group dev python -m unittest discover -s tests -v`.
The probe checks FastAPI multipart handling, Pillow image parsing, Pydantic
email validation, and pypdf parsing in the Cloudflare Python Worker runtime.
It does not connect to Supabase, Razorpay, or SMTP and contains no credentials.

On Windows, run the project from a C: drive path without spaces. The current
checkout at `D:\print bot` hits a known Pyodide/uv cross-drive limitation
([workers-py#270](https://github.com/cloudflare/workers-py/issues/270)).
Do not add a deploy script or production credentials to this project.
