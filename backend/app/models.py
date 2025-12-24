from sqlalchemy import Column, Integer, String, Text
from .core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class App(Base):
    __tablename__ = "apps"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    icon_url = Column(String)
    link_url = Column(String)
    description = Column(Text)
