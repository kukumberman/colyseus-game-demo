import { RoomAvailable } from "colyseus.js"
import { Link } from "react-router-dom"

type RoomLinkProps = {
  room: RoomAvailable
  href: string
}

export function RoomLinkView(props: RoomLinkProps) {
  return (
    <li>
      <span>{props.room.roomId}</span>
      &nbsp;
      <span>{props.room.name}</span>
      &nbsp;
      <span>{props.room.clients}</span>
      &nbsp;
      <Link to={props.href}>Join</Link>
    </li>
  )
}
