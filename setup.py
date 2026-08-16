"""Install the decoded CLI: ``pip install .`` then ``decoded start``."""

from pathlib import Path

from setuptools import find_packages, setup

ROOT = Path(__file__).resolve().parent
README = ROOT / "README.md"

setup(
    name="decoded",
    version="0.1.0",
    description="KV-cache optimization proxy for AI agents",
    long_description=README.read_text(encoding="utf-8") if README.is_file() else "",
    long_description_content_type="text/markdown",
    author="Sania Anees",
    url="https://github.com/SaniaAnees/dECODED",
    license="MIT",
    python_requires=">=3.9",
    packages=find_packages(exclude=("tests", "tests.*", "web", "web.*")),
    include_package_data=True,
    install_requires=[
        "fastapi>=0.104.0,<1.0.0",
        "uvicorn>=0.24.0,<1.0.0",
        "httpx>=0.25.0,<1.0.0",
        "python-dotenv>=1.0.0,<2.0.0",
        "click>=8.0.0,<9.0.0",
    ],
    entry_points={
        "console_scripts": [
            "decoded=cli_proxy.cli:main",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Environment :: Console",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Internet :: Proxy Servers",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
    ],
    project_urls={
        "Source": "https://github.com/SaniaAnees/dECODED",
        "Issues": "https://github.com/SaniaAnees/dECODED/issues",
    },
)
