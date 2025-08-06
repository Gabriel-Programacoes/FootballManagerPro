"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {Slot} from "@radix-ui/react-slot";

// A tag <aside> principal
export const Sidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
    ({ className, children, ...props }, ref) => (
        <aside
            ref={ref}
            className={cn(
                "fixed inset-y-0 left-0 z-10 w-72 border-r bg-background",
                "flex flex-col",
                className
            )}
            {...props}
        >
            {children}
        </aside>
    )
)
Sidebar.displayName = "Sidebar"

// O cabeçalho
export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn("border-b p-2", className)} {...props}>
            {children}
        </div>
    )
)
SidebarHeader.displayName = "SidebarHeader"

// O rodapé
export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn("mt-auto border-t p-2", className)} {...props}>
            {children}
        </div>
    )
)
SidebarFooter.displayName = "SidebarFooter"

// A área de conteúdo principal (com scroll)
export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn("flex-1 overflow-y-auto", className)} {...props}>
            {children}
        </div>
    )
)
SidebarContent.displayName = "SidebarContent"

// Um grupo de itens de menu
export const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => (
        <div ref={ref} className={cn("p-2", className)} {...props}>
            {children}
        </div>
    )
)
SidebarGroup.displayName = "SidebarGroup"

// O rótulo/título de um grupo
export const SidebarGroupLabel = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, children, ...props }, ref) => (
        <p
            ref={ref}
            className={cn("mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground", className)}
            {...props}
        >
            {children}
        </p>
    )
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

// O contêiner para o conteúdo de um grupo
export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, ...props }, ref) => (
        <div ref={ref} {...props}>
            {children}
        </div>
    )
)
SidebarGroupContent.displayName = "SidebarGroupContent"

// A lista <ul> de um menu
export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
    ({ className, children, ...props }, ref) => (
        <ul ref={ref} className={cn("space-y-1", className)} {...props}>
            {children}
        </ul>
    )
)
SidebarMenu.displayName = "SidebarMenu"

// O item <li> de um menu
export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
    ({ children, ...props }, ref) => (
        <li ref={ref} {...props}>
            {children}
        </li>
    )
)
SidebarMenuItem.displayName = "SidebarMenuItem"

// O botão <a> clicável
export const SidebarMenuButton = React.forwardRef<
    HTMLAnchorElement,
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }
>(({ className, asChild = false, children, ...props }, ref) => {
    // 2. Define o componente a ser renderizado: Slot se asChild for true, senão 'a'
    const Comp = asChild ? Slot : "a"

    return (
        // 3. Renderiza o componente dinâmico (Comp)
        <Comp
            ref={ref}
            className={cn(
                "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                className
            )}
            {...props}
        >
            {children}
        </Comp>
    )
})
SidebarMenuButton.displayName = "SidebarMenuButton"