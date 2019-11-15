export interface A {
    id: string
    aa: string
}

export interface B {
    id: string
    bb: string
}

export interface C {
    id: string
    cc: string
}

export interface State {
    // a: A
    b: Record<B['id'], B>
}