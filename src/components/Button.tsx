import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react"

const COLORS = {
    black: "bg-black hover:bg-gray-800 focus-visible:bg-gray-800",
    white: "bg-white hover:bg-gray-300 focus-visible:bg-gray-300",
    red: "bg-red-500 hover:bg-red-400 focus-visible:bg-red-400",
    green: "bg-green-500 hover:bg-green-400 focus-visible:bg-green-400",
    blue: "bg-blue-500 hover:bg-blue-400 focus-visible:bg-blue-400",
    default: "bg-gray-400 hover:bg-gray-300 focus-visible:bg-gray-300"
}

type ButtonProps = {
    small?: boolean
    color?: keyof typeof COLORS
    className?: string
} & DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>

export default function Button({small, color = "default", className="", ...props}: ButtonProps) {
    const sizeClasses = small? "px-2 py-1": "px-4 py-2 font-bold"
    const colorClass = COLORS[color]

    return <button className={`rounded-md transition-colors duration-200 
    disabled:cursor-not-allowed disabled:opacity-50 text-white ${sizeClasses} ${colorClass} ${className}`} {...props}></button>
}