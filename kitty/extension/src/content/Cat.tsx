import { useState } from 'preact/hooks';

export function Cat({ spriteUrl }: { spriteUrl: string }) {
  const [hover, setHover] = useState(false);
  return (
    <div class="kitty" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {hover && <div class="bubble">Meow! I'm Kitty.</div>}
      <img src={spriteUrl} alt="Kitty the cat" width={64} height={64} draggable={false} />
    </div>
  );
}
