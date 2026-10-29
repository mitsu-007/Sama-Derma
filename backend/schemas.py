"""Pydantic schemas for SamaDerma FastAPI inference service.

Strictly enforces:
- Audited 8-class diagnostic category labels.
- Clear designation of 'uncalibrated_score' (never 'clinical probability').
- Zero exposure of internal filesystem paths or private metadata.
"""

from __future__ import annotations

from typing import List
from pydantic import BaseModel, Field


class ScoreItem(BaseModel):
  class_index: int = Field(
      ..., ge=0, le=7, description="Audited class index (0 to 7)"
  )
  category: str = Field(..., description="Audited diagnostic category label")
  uncalibrated_score: float = Field(
      ..., ge=0.0, le=1.0, description="Uncalibrated model softmax score"
  )


class PredictionResponse(BaseModel):
  status: str = Field(default="success", description="Response status indicator")
  predicted_category: str = Field(
      ..., description="Category with highest uncalibrated model score"
  )
  predicted_score: float = Field(
      ...,
      ge=0.0,
      le=1.0,
      description="Score associated with the top predicted category",
  )
  scores: List[ScoreItem] = Field(
      ..., description="All eight diagnostic category scores, sorted descending"
  )
  device: str = Field(
      ..., description="Computation device used for inference (cuda or cpu)"
  )
  timestamp: str = Field(..., description="ISO 8601 UTC timestamp of inference")
  disclaimer: str = Field(
      default=(
          "Educational & research prototype only. Scores are uncalibrated"
          " dataset likelihoods and not clinical diagnoses. Never make healthcare"
          " decisions based on model outputs."
      ),
      description="Mandatory non-diagnostic research disclaimer",
  )


class HealthResponse(BaseModel):
  status: str = Field(default="healthy", description="Service health status")
  model_loaded: bool = Field(
      ..., description="Whether the Swin-B checkpoint is loaded in memory"
  )
  device: str = Field(
      ..., description="Active compute device (e.g. cuda or cpu)"
  )
  architecture: str = Field(
      default="swin_base_patch4_window12_384",
      description="Model architecture tag",
  )
  num_classes: int = Field(default=8, description="Number of output categories")


class ErrorResponse(BaseModel):
  detail: str = Field(
      ..., description="Sanitized client-facing error description"
  )
