from typing import Annotated
from pydantic import StringConstraints

QueryText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=4000)]
ReviewText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=10000)]
