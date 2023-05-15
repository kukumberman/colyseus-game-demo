import { useEffect, useState } from "react"

type SkinSelectorProps = {
  length: number
  onChanged: (skinIndex: number) => void
  imagePathResolver: (skinIndex: number) => string
}

export function SkinSelectorView(props: SkinSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    props.onChanged(currentIndex)
  }, [currentIndex])

  function prettyText() {
    return `${currentIndex + 1} / ${props.length}`
  }

  function onClickSetPrevious() {
    if (currentIndex - 1 < 0) {
      setCurrentIndex(props.length - 1)
    } else {
      setCurrentIndex(currentIndex - 1)
    }
  }

  function onClickSetNext() {
    if (currentIndex + 1 === props.length) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  return (
    <div>
      <div>
        <img src={props.imagePathResolver(currentIndex)} />
      </div>
      <button onClick={onClickSetPrevious}>Previous</button>
      <span>{prettyText()}</span>
      <button onClick={onClickSetNext}>Next</button>
    </div>
  )
}
