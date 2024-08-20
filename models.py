"""Models for flask-feedback."""

from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

bcrypt = Bcrypt()
db = SQLAlchemy()


class User(db.Model):
    """Site user."""

    __tablename__ = "users"

    username = db.Column(
        db.String(20),
        nullable=False,
        unique=True,
        primary_key=True,
    )
    password = db.Column(db.Text, nullable=False)
    funds = db.Column(db.Integer, nullable=False)

    # start of convenience class methods

    @classmethod
    def register(cls, username, password, funds):
        """Register a user, hashing their password."""

        hashed = bcrypt.generate_password_hash(password)
        hashed_utf8 = hashed.decode("utf8")
        user = cls(
            username=username,
            password=hashed_utf8,
            funds=funds
        )

        db.session.add(user)
        return user

    @classmethod
    def authenticate(cls, username, password):
        """Validate that user exists & password is correct.

        Return user if valid; else return False.
        """

        user = User.query.filter_by(username=username).first()

        if user and bcrypt.check_password_hash(user.password, password):
            return user
        else:
            return False
        
    def to_dict(self):
        """Serialize User to a dict of User info."""

        return {
            "userName": self.username,
            "password": self.password,
            "funds": self.funds,
        }

    @classmethod
    def check_for_taken(cls, username):
        """Validate that user exists & password is correct.

        Return user if valid; else return False.
        """

        user = User.query.filter_by(username=username).first()

        if user:
            return True
        else:
            return False
        

def connect_db(app):
    """Connect to database."""
    with app.app_context():
        db.app = app
        db.init_app(app)
        db.create_all()


