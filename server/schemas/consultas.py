from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, UniqueConstraint
from server.schemas.base import Base

class Consulta(Base):
    __tablename__ = 'consultas'  

    # Definición de columnas
    id_consulta = Column(Integer, primary_key=True, autoincrement=True)  
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=False)  
    fecha_consulta = Column(String, nullable=False)  
    datos_entrada = Column(String, nullable=False)  
    prediccion = Column(Numeric, nullable=False) 

    
    __table_args__ = (
        UniqueConstraint('id_consulta', name='uniq_idconsulta'),  
    )