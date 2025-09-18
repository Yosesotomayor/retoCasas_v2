import logging
import asyncio
from typing import Optional
from sqlalchemy import text, select
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.exc import NoResultFound

from server.schemas.users import Usuario
from server.schemas.pagos import Pago
from server.schemas.consultas import Consulta
from server.schemas.base import Base

logger = logging.getLogger(__name__)

class Instance:
    def __init__(
        self, engine: AsyncEngine, session_factory: async_sessionmaker[AsyncSession]
    ):
        self.engine = engine
        self.session_factory = session_factory


class Database:
    _instance: Optional[Instance] = None

    @staticmethod
    def initialize(connection_string: str):
        if Database._instance is None:
            Database._instance = Database._create_instance(connection_string)

    @staticmethod
    def _create_instance(connection_string: str):
        engine = create_async_engine(
            connection_string,
            pool_size=10,
            max_overflow=0,
            pool_pre_ping=True,
            echo=True,
        )
        session_factory = async_sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )
        return Instance(engine, session_factory)

    @staticmethod
    async def wait_for_connection(max_retries: int = 30):
        if Database._instance is None:
            raise Exception(
                "Database not initialized. Call Database.initialize() first."
            )

        retries = 0
        while retries < max_retries:
            try:
                logger.info(f"Attempting database connection (attempt {retries + 1}/{max_retries})")
                async with Database._instance.engine.begin() as conn:
                    await conn.execute(text("SELECT 1"))
                logger.info("Database connection established.")
                return
            except Exception as e:
                retries += 1
                logger.error(f"Database connection failed (attempt {retries}/{max_retries}): {type(e).__name__}: {e}")
                if retries >= max_retries:
                    raise Exception(f"Failed to connect to database after {max_retries} attempts: {e}")
                await asyncio.sleep(1)

    @staticmethod
    async def create_tables():
        if Database._instance is None:
            raise Exception(
                "Database not initialized. Call Database.initialize() first."
            )

        async with Database._instance.engine.begin() as conn:
            # Elimina las tablas existentes (opcional)
            await conn.run_sync(Base.metadata.drop_all)

            # Crea las tablas
            await conn.run_sync(Base.metadata.create_all)

            logger.info("Tablas creadas correctamente.")

    @staticmethod
    async def cleanup():
        if Database._instance is None:
            raise Exception(
                "Database not initialized. Call Database.initialize() first."
            )

        await Database._instance.engine.dispose()

    @staticmethod
    def get_session() -> AsyncSession:
        if Database._instance is None:
            raise Exception(
                "Database not initialized. Call Database.initialize() first."
            )

        return Database._instance.session_factory()
    
    @staticmethod
    async def create_user(nombre: str, email: str, password_hash: str, fecha_registro, tel: str):
        """
        Crea un nuevo usuario en la base de datos.
        """
        async with Database.get_session() as session:
            async with session.begin():
                nuevo_usuario = Usuario(
                    nombre=nombre,
                    email=email,
                    password_hash=password_hash,
                    fecha_registro=fecha_registro,
                    tel=tel
                )
                session.add(nuevo_usuario)
                await session.commit()
                logger.info(f"Usuario creado: {email}")

    @staticmethod
    async def delete_user(user_id: int):
        """
        Elimina un usuario de la base de datos por su ID.
        """
        async with Database.get_session() as session:
            async with session.begin():
                query = select(Usuario).where(Usuario.id_usuario == user_id)
                result = await session.execute(query)
                usuario = result.scalar_one_or_none()

                if usuario is None:
                    logger.warning(f"Usuario con ID {user_id} no encontrado.")
                    raise NoResultFound(f"Usuario con ID {user_id} no encontrado.")

                await session.delete(usuario)
                await session.commit()
                logger.info(f"Usuario con ID {user_id} eliminado.")

    @staticmethod
    async def update_user(user_id: int, **kwargs):
        """
        Actualiza los datos de un usuario en la base de datos.
        """
        async with Database.get_session() as session:
            async with session.begin():
                query = select(Usuario).where(Usuario.id_usuario == user_id)
                result = await session.execute(query)
                usuario = result.scalar_one_or_none()

                if usuario is None:
                    logger.warning(f"Usuario con ID {user_id} no encontrado.")
                    raise NoResultFound(f"Usuario con ID {user_id} no encontrado.")

                for key, value in kwargs.items():
                    if hasattr(usuario, key):
                        setattr(usuario, key, value)

                await session.commit()
                logger.info(f"Usuario con ID {user_id} actualizado.")


    @staticmethod
    async def create_payment(id_usuario: int, monto: float, fecha_pago, metodo_pago: str, estatus: str, id_transac_externa: str):
        """
        Crea un nuevo pago en la base de datos.
        """
        async with Database.get_session() as session:
            async with session.begin():
                nuevo_pago = Pago(
                    id_usuario=id_usuario,
                    monto=monto,
                    fecha_pago=fecha_pago,
                    metodo_pago=metodo_pago,
                    estatus=estatus,
                    id_transac_externa=id_transac_externa
                )
                session.add(nuevo_pago)
                await session.commit()
                logger.info(f"Pago creado con ID de transacción externa: {id_transac_externa}")

    @staticmethod
    async def delete_payment(payment_id: int):
        """
        Elimina un pago de la base de datos por su ID.
        """
        async with Database.get_session() as session:
            async with session.begin():
                query = select(Pago).where(Pago.id_pago == payment_id)
                result = await session.execute(query)
                pago = result.scalar_one_or_none()

                if pago is None:
                    logger.warning(f"Pago con ID {payment_id} no encontrado.")
                    raise NoResultFound(f"Pago con ID {payment_id} no encontrado.")

                await session.delete(pago)
                await session.commit()
                logger.info(f"Pago con ID {payment_id} eliminado.")

    @staticmethod
    async def update_payment(payment_id: int, **kwargs):
        """
        Actualiza los datos de un pago en la base de datos.
        """
        async with Database.get_session() as session:
            async with session.begin():
                query = select(Pago).where(Pago.id_pago == payment_id)
                result = await session.execute(query)
                pago = result.scalar_one_or_none()

                if pago is None:
                    logger.warning(f"Pago con ID {payment_id} no encontrado.")
                    raise NoResultFound(f"Pago con ID {payment_id} no encontrado.")

                for key, value in kwargs.items():
                    if hasattr(pago, key):
                        setattr(pago, key, value)

                await session.commit()
                logger.info(f"Pago con ID {payment_id} actualizado.")


    @staticmethod
    async def create_consulta(id_usuario: int, fecha_consulta, datos_entrada: str, prediccion: float):
        """
        Crea una nueva consulta en la base de datos.
        """
        async with Database.get_session() as session:
            async with session.begin():
                nueva_consulta = Consulta(
                    id_usuario=id_usuario,
                    fecha_consulta=fecha_consulta,
                    datos_entrada=datos_entrada,
                    prediccion=prediccion
                )
                session.add(nueva_consulta)
                await session.commit()
                logger.info(f"Consulta creada para el usuario con ID: {id_usuario}")

    @staticmethod
    async def delete_consulta(consulta_id: int):
        """
        Elimina una consulta de la base de datos por su ID.
        """
        async with Database.get_session() as session:
            async with session.begin():
                query = select(Consulta).where(Consulta.id_consulta == consulta_id)
                result = await session.execute(query)
                consulta = result.scalar_one_or_none()

                if consulta is None:
                    logger.warning(f"Consulta con ID {consulta_id} no encontrada.")
                    raise NoResultFound(f"Consulta con ID {consulta_id} no encontrada.")

                await session.delete(consulta)
                await session.commit()
                logger.info(f"Consulta con ID {consulta_id} eliminada.")

    @staticmethod
    async def update_consulta(consulta_id: int, **kwargs):
        """
        Actualiza los datos de una consulta en la base de datos.
        """
        async with Database.get_session() as session:
            async with session.begin():
                query = select(Consulta).where(Consulta.id_consulta == consulta_id)
                result = await session.execute(query)
                consulta = result.scalar_one_or_none()

                if consulta is None:
                    logger.warning(f"Consulta con ID {consulta_id} no encontrada.")
                    raise NoResultFound(f"Consulta con ID {consulta_id} no encontrada.")

                for key, value in kwargs.items():
                    if hasattr(consulta, key):
                        setattr(consulta, key, value)

                await session.commit()
                logger.info(f"Consulta con ID {consulta_id} actualizada.")
    