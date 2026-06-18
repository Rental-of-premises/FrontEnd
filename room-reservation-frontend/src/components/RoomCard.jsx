import { Link } from 'react-router-dom'

export default function RoomCard({ room }) {
  return (
    <div className="card">
      <img src={room.image_url} alt={room.title} />
      <div className="card-content">
        <h3>{room.title}</h3>
        <p className="type">{room.room_type}</p>
        <p className="description">{room.description.slice(0, 100)}...</p>
        <div className="info">
          <span>{room.capacity}</span>
          <span className="price">${room.price_per_hour}/час</span>
        </div>
        <Link to={`/catalog/${room.id}`}>
          <button>Подробнее</button>
        </Link>
      </div>
    </div>
  )
}