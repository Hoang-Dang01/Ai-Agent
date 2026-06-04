import uuid
import enum
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base

class DocumentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    INDEXED = "INDEXED"
    FAILED = "FAILED"

class Document(Base):
    __tablename__ = "documents"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    status = Column(SQLEnum(DocumentStatus, name="document_status_enum"), nullable=False, default=DocumentStatus.PENDING)
    content_hash = Column(String(64), unique=True, nullable=False)  # SHA-256 hash
    storage_path = Column(String(512), nullable=True)  # Path to local MD file
    file_size = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    versions = relationship("Version", back_populates="document", cascade="all, delete-orphan")

class Version(Base):
    __tablename__ = "versions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    commit_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    document = relationship("Document", back_populates="versions")
    embedding = relationship("Embedding", back_populates="version", uselist=False, cascade="all, delete-orphan")
    nodes = relationship("GraphNode", back_populates="version", cascade="all, delete-orphan")
    edges = relationship("GraphEdge", back_populates="version", cascade="all, delete-orphan")

class Embedding(Base):
    __tablename__ = "embeddings"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("versions.id", ondelete="CASCADE"), unique=True, nullable=False)
    embedding = Column(Vector(768))
    model_name = Column(String(100), nullable=False, default="text-embedding-004")
    version = relationship("Version", back_populates="embedding")

class GraphNode(Base):
    __tablename__ = "graph_nodes"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("versions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    label = Column(String(100), nullable=False)  # e.g., 'Application', 'Tool', 'Concept'
    properties = Column(Text, nullable=True)      # JSON string or simple text desc
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    version = relationship("Version", back_populates="nodes")

    # Enforce unique entity name per version to keep graph clean
    __table_args__ = (
        UniqueConstraint('version_id', 'name', name='_version_node_uc'),
    )

class GraphEdge(Base):
    __tablename__ = "graph_edges"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("versions.id", ondelete="CASCADE"), nullable=False)
    source_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False)
    target_id = Column(UUID(as_uuid=True), ForeignKey("graph_nodes.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(100), nullable=False)   # e.g., 'inputs_into', 'runs_on'
    properties = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    version = relationship("Version", back_populates="edges")
    source = relationship("GraphNode", foreign_keys=[source_id])
    target = relationship("GraphNode", foreign_keys=[target_id])
