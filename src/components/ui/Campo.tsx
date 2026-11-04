type Props = React.InputHTMLAttributes<HTMLInputElement> & { rotulo: string };

export function Campo({ rotulo, className = "", ...props }: Props) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-vinho-escuro/80">{rotulo}</span>
      <input className="campo" {...props} />
    </label>
  );
}

type AreaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & { rotulo: string };

export function Area({ rotulo, className = "", ...props }: AreaProps) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-vinho-escuro/80">{rotulo}</span>
      <textarea className="campo min-h-[90px]" {...props} />
    </label>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { rotulo: string };

export function Selecao({ rotulo, className = "", children, ...props }: SelectProps) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-vinho-escuro/80">{rotulo}</span>
      <select className="campo" {...props}>
        {children}
      </select>
    </label>
  );
}
