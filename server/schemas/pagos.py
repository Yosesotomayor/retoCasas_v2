from sqlalchemy import Column, Integer, Numeric, Date, String, ForeignKey, UniqueConstraint, CheckConstraint
from server.schemas.base import Base

class Pago(Base):
    __tablename__ = 'pagos'  

    # Definición de columnas
    id_pago = Column(Integer, primary_key=True, autoincrement=True)  
    id_usuario = Column(Integer, ForeignKey('usuarios.id_usuario'), nullable=False)  
    monto = Column(Numeric, nullable=False) 
    fecha_pago = Column(Date, nullable=False)  
    metodo_pago = Column(String, nullable=False)  
    estatus = Column(String, nullable=False)  
    id_transac_externa = Column(String, nullable=False)  

    # Restricciones adicionales
    __table_args__ = (
        UniqueConstraint('id_transac_externa', name='uniq_id_transac'),  
        UniqueConstraint('id_pago', name='uniq_idpago'),  
        CheckConstraint("metodo_pago IN ('tarjeta', 'paypal', 'transferencia')", name='control_metodopago'),  
        CheckConstraint("estatus IN ('completado', 'pendiente', 'fallido')", name='control_estatuspago')  
    )