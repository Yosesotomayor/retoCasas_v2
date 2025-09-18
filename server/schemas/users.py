from sqlalchemy import Column, Integer, String, Date, UniqueConstraint, CheckConstraint
from server.schemas.base import Base
class Usuario(Base):
    __tablename__ = 'usuarios'  

    
    id_usuario = Column(Integer, primary_key=True, autoincrement=True)  
    nombre = Column(String, nullable=False)  
    email = Column(String, nullable=False, unique=True)  
    password_hash = Column(String(60), nullable=False)  
    fecha_registro = Column(String, nullable=False) 
    tel = Column(String(10), nullable=False)  

    
    __table_args__ = (
        UniqueConstraint('email', name='uniq_email'),  
        CheckConstraint("length(tel) = 10 AND tel ~ '^[0-9]+$'", name='numeric_tel')  
    )