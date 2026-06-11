// src/pages/BookingForm.jsx
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function BookingForm() {
  const { id } = useParams();

  return (
    <>
      <Navbar />
      <div className="booking-stub-container">
        <div className="booking-stub-card">
          <div className="booking-stub-icon">📅</div>
          <h1 className="booking-stub-title">Страница бронирования</h1>
          <p className="booking-stub-text">
            Страница бронирования помещения #{id} находится в разработке.
          </p>
          <p className="booking-stub-subtext">
            Скоро здесь появится форма для выбора даты, времени и подтверждения бронирования.
          </p>
          <Link to={`/catalog/${id}`}>
            <button className="booking-stub-btn">
              ← Вернуться к помещению
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}