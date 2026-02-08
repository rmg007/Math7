"""
Pydantic schemas for validating AI-generated questions.
Ensures strict compliance with Questerix database schema.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Dict, Any, List, Optional
from enum import Enum


class QuestionType(str, Enum):
    """Question types matching database enum."""
    MULTIPLE_CHOICE = "multiple_choice"
    MCQ_MULTI = "mcq_multi"
    TEXT_INPUT = "text_input"
    BOOLEAN = "boolean"
    REORDER_STEPS = "reorder_steps"


class DifficultyLevel(str, Enum):
    """Difficulty levels for questions."""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class QuestionOption(BaseModel):
    """Single option for multiple choice questions."""
    id: str = Field(..., description="Option identifier (a, b, c, d)")
    text: str = Field(..., description="Option content")


class QuestionSchema(BaseModel):
    """
    Validated schema for a single generated question.
    Maps directly to `questions` table structure.
    """
    # Core fields
    content: str = Field(..., min_length=10, description="Question text (supports Markdown)")
    type: QuestionType = Field(default=QuestionType.MULTIPLE_CHOICE)
    
    # Type-specific data
    options: Dict[str, Any] = Field(default_factory=dict, description="JSONB options field")
    solution: Dict[str, Any] = Field(..., description="JSONB solution field")
    
    # Metadata
    explanation: Optional[str] = Field(None, description="Explanation shown after answering")
    points: int = Field(default=1, ge=1, le=10, description="Points awarded")
    
    # AI generation metadata (not stored in DB)
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="AI confidence")
    
    @field_validator("options", mode="before")
    @classmethod
    def validate_options(cls, v, info):
        """Ensure options match question type."""
        question_type = info.data.get("type")
        
        if question_type == QuestionType.MULTIPLE_CHOICE:
            # Must have options array
            if "options" not in v:
                raise ValueError("Multiple choice questions must have 'options' array")
            if not isinstance(v["options"], list):
                raise ValueError("'options' must be an array")
            if len(v["options"]) < 2:
                raise ValueError("Must have at least 2 options")
        
        return v
    
    @field_validator("solution", mode="before")
    @classmethod
    def validate_solution(cls, v, info):
        """Ensure solution matches question type."""
        question_type = info.data.get("type")
        
        if question_type == QuestionType.MULTIPLE_CHOICE:
            if "correct_option_id" not in v:
                raise ValueError("Multiple choice solutions must have 'correct_option_id'")
        
        elif question_type == QuestionType.TEXT_INPUT:
            if "exact_match" not in v:
                raise ValueError("Text input solutions must have 'exact_match'")
        
        elif question_type == QuestionType.BOOLEAN:
            if "correct_value" not in v:
                raise ValueError("Boolean solutions must have 'correct_value'")
        
        return v


class GenerationRequest(BaseModel):
    """Request schema for question generation."""
    text: str = Field(..., min_length=50, description="Source text to generate from")
    skill_id: str = Field(..., description="UUID of target skill")
    difficulty_distribution: Dict[DifficultyLevel, int] = Field(
        ...,
        description="Number of questions per difficulty"
    )
    model: str = Field(default="gemini-1.5-flash")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class GenerationResponse(BaseModel):
    """Response schema for question generation."""
    questions: List[QuestionSchema]
    total_generated: int
    token_count: int
    generation_time_ms: int
    model_used: str
