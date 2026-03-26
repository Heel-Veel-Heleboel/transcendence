import { ReactNode } from "react"


export function ProfilePropertiesPrimary({ children }: { children: ReactNode }) {
    return (
        <div className="flex justify-around min-h-1/2">
            <div />
            <div className="text-left w-3/5 flex flex-col justify-between min-h-full">
                <div />
                <div className="flex flex-col justify-around min-h-3/5">
                    {children}
                </div>
                <div />
            </div>
            <div />
        </div>
    )
}

export function ProfilePropertiesSecundary({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-1/2">
            {children}
        </div>

    )
}

export function ProfileProperties({ children }: { children: ReactNode }) {
    return (
        <div id='profileProperties' className="w-1/2 min-h-full flex flex-col text-xl">
            {children}
        </div>
    )

}
