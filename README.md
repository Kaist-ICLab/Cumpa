# Cumpa

## Installation

Enable venv and install the requirements.


```bash
# Activate virtual env
python3 -m venv venv

source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Additional Instructions for Raspberry Pi

On Raspberry Pi, dearpygui may not install directly via pip. 

Comment the following requirement.txt line

```bash
# dearpygui==2.0.0
```

Instead, use the provided or downloaded .whl file:

Download dearpygui-1.11.1-cp311-cp311-linux_aarch64.whl from team's shared drive or PyPI.

Install it manually:

```bash
pip install dearpygui-1.11.1-cp311-cp311-linux_aarch64.whl
```
