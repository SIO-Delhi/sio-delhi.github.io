declare module '*/flagwaver/subjects/Flag' {
    export default class Flag {
        constructor(options: any)
        object: any
        mesh: any
        cloth: any
        simulate(delta: number): void
        render(): void
        destroy(): void
    }
}

declare module '*/flagwaver/subjects/Wind' {
    export default class Wind {
        constructor(options: any)
        update(): void
    }
}

declare module '*/flagwaver/interactions/applyWindForceToCloth' {
    export default function applyWindForceToCloth(cloth: any, wind: any, object: any): void
}

declare module '*/flagwaver/interactions/applyGravityToCloth' {
    export default function applyGravityToCloth(cloth: any, object: any): void
}
