export interface A {
    name: string
}

export interface C {
    color: string
}

export interface B {
    c: C
}

export interface State {
    a: A
    b: B
}