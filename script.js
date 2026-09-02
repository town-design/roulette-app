const canvas = document.getElementById("roulette");
const ctx = canvas.getContext("2d");

const spinButton = document.getElementById("spinButton");
const addButton = document.getElementById("addButton");
const resetButton = document.getElementById("resetButton");
const itemList = document.getElementById("itemList");
const result = document.getElementById("result");

let rotation = 0;
let spinning = false;

const savedItems = localStorage.getItem("rouletteItems");

let items = savedItems
    ? JSON.parse(savedItems)
    : [
        { name: "A", remaining: 3, initial: 3 },
        { name: "B", remaining: 3, initial: 3 },
        { name: "C", remaining: 3, initial: 3 }
    ];


/* ------------------------------
   データを保存
------------------------------ */

function saveItems() {
    localStorage.setItem("rouletteItems", JSON.stringify(items));
}


/* ------------------------------
   選択肢一覧を表示
------------------------------ */

function renderItems() {

    itemList.innerHTML = "";

    items.forEach((item, index) => {

        const row = document.createElement("div");
        row.className = "item-row";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = item.name;
        nameInput.placeholder = "選択肢名";

        nameInput.addEventListener("input", () => {
            items[index].name = nameInput.value;
            saveItems();
            drawWheel();
        });


        const countInput = document.createElement("input");
        countInput.type = "number";
        countInput.min = "0";
        countInput.value = item.remaining;

        countInput.addEventListener("change", () => {

            let value = parseInt(countInput.value);

            if (isNaN(value) || value < 0) {
                value = 0;
            }

            items[index].remaining = value;
            items[index].initial = value;

            countInput.value = value;

            saveItems();
            drawWheel();
        });


        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-button";
        deleteButton.textContent = "×";

        deleteButton.addEventListener("click", () => {

            if (spinning) return;

            items.splice(index, 1);

            saveItems();
            renderItems();
            drawWheel();

            result.textContent = "";
        });


        row.appendChild(nameInput);
        row.appendChild(countInput);
        row.appendChild(deleteButton);

        itemList.appendChild(row);
    });
}


/* ------------------------------
   ルーレットを描く
------------------------------ */

function drawWheel() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;

    const activeItems = items.filter(item => item.remaining > 0);
    const totalRemaining = activeItems.reduce(
        (sum, item) => sum + item.remaining,
        0
    );

    if (totalRemaining === 0) {

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "#eeeeee";
        ctx.fill();

        ctx.fillStyle = "#777";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            "選択肢を設定してください",
            centerX,
            centerY
        );

        return;
    }

    const sliceAngle = (Math.PI * 2) / activeItems.length;
    let startAngle = -Math.PI / 2 + rotation;

    activeItems.forEach((item, index) => {

        const endAngle = startAngle + sliceAngle;


        ctx.beginPath();
ctx.moveTo(centerX, centerY);
ctx.arc(
    centerX,
    centerY,
    radius,
    startAngle,
    endAngle
);
ctx.closePath();

const colors = [
    "#4472C4",
    "#ED7D31",
    "#A5A5A5",
    "#FFC000",
    "#5B9BD5",
    "#70AD47",
    "#264478",
    "#9E480E",
    "#636363",
    "#997300",
    "#255E91",
    "#43682B"
];

ctx.fillStyle = colors[index % colors.length];

ctx.fill();

ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 3;
ctx.stroke();

        const middleAngle = startAngle + sliceAngle / 2;

        ctx.save();

        ctx.translate(centerX, centerY);
        ctx.rotate(middleAngle);

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#222";
        ctx.font = "bold 15px sans-serif";

        let displayName = item.name || "名称なし";

        if (displayName.length > 10) {
            displayName =
                displayName.substring(0, 10) + "…";
        }

        ctx.fillText(
            displayName,
            radius - 15,
            0
        );

        ctx.restore();

        startAngle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(
        centerX,
        centerY,
        18,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 2;
    ctx.stroke();
}


/* ------------------------------
   抽選する
------------------------------ */

function chooseItem() {

    const activeItems = items
        .map((item, index) => ({
            ...item,
            originalIndex: index
        }))
        .filter(item => item.remaining > 0);


    const total = activeItems.reduce(
        (sum, item) => sum + item.remaining,
        0
    );

    if (total === 0) {
        return null;
    }


    let random =
        Math.floor(Math.random() * total) + 1;

    let cumulative = 0;


    for (const item of activeItems) {

        cumulative += item.remaining;

        if (random <= cumulative) {
            return item;
        }
    }

    return null;
}


/* ------------------------------
   当選位置の角度を計算
------------------------------ */

function getItemMiddleAngle(targetIndex) {

    const activeItems = items
        .map((item, index) => ({
            ...item,
            originalIndex: index
        }))
        .filter(item => item.remaining > 0);

    const activeCount = activeItems.length;

    if (activeCount === 0) {
        return 0;
    }

    const sliceAngle = (Math.PI * 2) / activeCount;

    for (let i = 0; i < activeItems.length; i++) {
        if (activeItems[i].originalIndex === targetIndex) {
            return i * sliceAngle + sliceAngle / 2;
        }
    }

    return 0;
}


/* ------------------------------
   ルーレット開始
------------------------------ */

spinButton.addEventListener("click", () => {

    if (spinning) return;


    const selected = chooseItem();


    if (!selected) {

        result.textContent =
            "🎉 すべて使い切りました！";

        return;
    }


    spinning = true;
    spinButton.disabled = true;

    result.textContent = "抽選中…";


    const middleAngle =
        getItemMiddleAngle(selected.originalIndex);


    const fullCircle = Math.PI * 2;

    const currentMod =
        ((rotation % fullCircle) + fullCircle)
        % fullCircle;


    const desiredMod =
        ((-middleAngle % fullCircle) + fullCircle)
        % fullCircle;


    let adjustment =
        desiredMod - currentMod;


    if (adjustment < 0) {
        adjustment += fullCircle;
    }


    const extraTurns =
        5 + Math.floor(Math.random() * 3);


    const startRotation = rotation;

    const targetRotation =
        rotation +
        extraTurns * fullCircle +
        adjustment;


    const duration = 3500;

    const startTime = performance.now();


    function animate(currentTime) {

        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(elapsed / duration, 1);


        /* 徐々にゆっくり止まる */

        const eased =
            1 - Math.pow(1 - progress, 4);


        rotation =
            startRotation +
            (targetRotation - startRotation)
            * eased;


        drawWheel();


        if (progress < 1) {

            requestAnimationFrame(animate);

        } else {

            rotation = targetRotation;

            finishSpin(selected);
        }
    }


    requestAnimationFrame(animate);
});


/* ------------------------------
   抽選終了
------------------------------ */

function finishSpin(selected) {

    result.textContent =
        `🎉 ${selected.name || "名称なし"}！`;


    const index = selected.originalIndex;


    if (items[index].remaining > 0) {
        items[index].remaining--;
    }


    saveItems();

    spinning = false;
    spinButton.disabled = false;


    setTimeout(() => {

        renderItems();
        drawWheel();

        const totalRemaining =
            items.reduce(
                (sum, item) =>
                    sum + item.remaining,
                0
            );


        if (totalRemaining === 0) {

            result.textContent =
                `🎉 ${selected.name || "名称なし"}！ 全て終了しました！`;
        }

    }, 600);
}


/* ------------------------------
   選択肢を追加
------------------------------ */

addButton.addEventListener("click", () => {

    if (spinning) return;


    items.push({
        name: `選択肢${items.length + 1}`,
        remaining: 1,
        initial: 1
    });


    saveItems();
    renderItems();
    drawWheel();
});


/* ------------------------------
   最初の個数に戻す
------------------------------ */

resetButton.addEventListener("click", () => {

    if (spinning) return;


    const ok = confirm(
        "残り個数を最初の状態に戻しますか？"
    );


    if (!ok) return;


    items.forEach(item => {
        item.remaining = item.initial;
    });


    result.textContent = "";

    saveItems();
    renderItems();
    drawWheel();
});


/* ------------------------------
   最初の表示
------------------------------ */

renderItems();
drawWheel();

/* ------------------------------
   オフライン対応
------------------------------ */

if ("serviceWorker" in navigator) {

    window.addEventListener("load", () => {

        navigator.serviceWorker
            .register("./service-worker.js")
            .then(() => {
                console.log("オフライン対応の準備が完了しました");
            })
            .catch(error => {
                console.error(
                    "Service Workerの登録に失敗しました",
                    error
                );
            });

    });

}