class Modal {
    #container;
    #modal;
    constructor() {
        this.#container = document.createElement('div');
        this.#container.classList.add('modal-container');
        this.#modal = document.createElement('div');
        this.#modal.classList.add('modal');
        this.#modal.onclick = e =>
            e.stopPropagation();

        this.#container.append(this.#modal);

        this.#container.onclick = e => this.close();
    }
    append(...innerElements) {
        this.#modal.append(...innerElements);
    }
    show() {
        document.getElementById('app').append(this.#container);
        UIAnimation.createAppearingAnimation(this.#modal);
    }
    close() {
        UIAnimation.createDisappearingAnimation(this.#modal, this.#container);
    }
}


class ButtonTypes {
    static ICON = ['button', 'button-icon'];
    static SUBMIT = ['button', 'button-submit'];
}
class Icons {
    static DELETE = '⌫';//'🗑';
    static ADD = "➕";
    static SCHOOL = "🏫";
    static PLANE = "🛫";
    static SHIP = "🛳";
    static WEDDING = "💒";
    static HOSPITAL = "🏥";
    static DANCE = "💃";
    static LIBRARY = "📚";
    static MUSIC = "🎼";
    static STAR = '★';
    static OLD_WOMAN = '👵';
    static EMPTY = "";
    static ALL = [Icons.EMPTY, Icons.OLD_WOMAN, Icons.STAR, Icons.DELETE, Icons.ADD, Icons.SCHOOL, Icons.PLANE, Icons.SHIP, Icons.WEDDING, Icons.HOSPITAL, Icons.DANCE, Icons.LIBRARY, Icons.MUSIC];
}

class ButtonFactory {
    static createIconButton(icon, backgroundColor = Colors.TRANSPARENT) {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = icon;
        buttonElement.classList.add(...ButtonTypes.ICON);
        buttonElement.style.backgroundColor = backgroundColor;
        return buttonElement;
    }
    static createSubmitButton(text = 'submit', icon = Icons.EMPTY) {
        const buttonElement = document.createElement('button');
        buttonElement.classList.add(...ButtonTypes.SUBMIT);
        buttonElement.textContent = icon + text;
        return buttonElement;
    }
}

class SelectFactory {
    static createSelect(elementName, options, selectedOption) {

        const select = document.createElement('select');
        select.name = elementName;
        for (let option of options) {
            const optionElement = document.createElement('option');
            optionElement.textContent = option;
            optionElement.selected = option === selectedOption;
            select.append(optionElement);
        }
        return select;
    }
}

class AnimationDuration {
    static SHORT = 444;
    static LONG = 1111;
}
class AnimationClasses {
    static DISAPPEAR_SHORT = "disappear-short";
    static APPEAR_SHORT = "appear-short";
}
class UIAnimation {
    static DISAPPEAR = new UIAnimation(AnimationClasses.DISAPPEAR_SHORT, AnimationDuration.SHORT);
    static APPEAR = new UIAnimation(AnimationClasses.APPEAR_SHORT, AnimationDuration.SHORT);
    constructor(className, time) {
        this.className = className;
        this.time = time;
    }
    static createDisappearingAnimation(element, ...additionalElementsToRemove) {
        const animation = UIAnimation.DISAPPEAR;
        element.classList.remove(UIAnimation.APPEAR.className);
        element.classList.add(animation.className);
        window.setTimeout(() => {
            element.remove();
            additionalElementsToRemove.forEach(e => e.remove());
        }, animation.time);
    }
    static createAppearingAnimation(element) {
        // element.classList.remove(CalendarAnimation.DISAPPEAR.className);
        const animation = UIAnimation.APPEAR;
        element.classList.add(animation.className);
    }
}

class Colors {
    static YELLOW = 'yellow';
    static RED = 'firebrick';
    static GREENYELLOW = 'greenyellow';
    static PINK = 'pink';
    static PURPLE = 'purple';
    static ORCHID = 'orchid';
    static GOLDENROD = 'goldenrod';
    static TRANSPARENT = 'transparent';
    static WEEKDAY = Colors.YELLOW;
    static WEEKEND = Colors.PURPLE;
    static WARNING_BG = Colors.RED;
    static ALL = [Colors.GOLDENROD, Colors.ORCHID, Colors.YELLOW, Colors.GREENYELLOW, Colors.PINK,
    Colors.RED, Colors.PURPLE, Colors.TRANSPARENT].sort();
}

class ErrorModal extends Modal {
    constructor(text) {
        super();
        const formArea = document.createElement("div");
        const title = document.createElement("h2");
        title.textContent =
            "Oh no!";
        const message = document.createElement("p");
        message.textContent = text;

        
        const button = ButtonFactory.createSubmitButton(
            "Ok"
        );
        button.onclick = (e) => {
            this.close();
        }
        super.append(title, message, button);
    }
}
