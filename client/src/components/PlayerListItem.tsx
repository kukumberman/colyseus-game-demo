import { Player } from "@shared/schemas"

type PlayerListItemProps = {
  index: number
  player: Player
  isMine: boolean
}

export function PlayerListItem(props: PlayerListItemProps) {
  const { index, player } = props
  let text = `${index + 1} ${player.name} ${player.sessionId} (${player.ping} ms)`
  if (props.isMine) {
    text += " (You)"
  }
  return <li>{text}</li>
}
