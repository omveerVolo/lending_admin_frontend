

export const navState = $state({
    prevPath: "",
    currPath: "",
})

export function updateNav(path) {
    if (navState.currPath !== path) {

        navState.prevPath = navState.currPath;
        navState.currPath = path;
    }
}