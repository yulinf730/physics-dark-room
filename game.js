/* Physics Dark Room - Web App build
   Human-readable text revision: clearer story, more natural choices, less machine-like wording.
*/

const webStorage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

function showOverlay({ title = '', content = '', html = '', buttons = [] }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const box = document.createElement('div');
  box.className = 'modal-box';
  if (title) {
    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = title;
    box.appendChild(h);
  }
  if (html) {
    const div = document.createElement('div');
    div.className = 'modal-content';
    div.innerHTML = html;
    box.appendChild(div);
  } else if (content) {
    const p = document.createElement('div');
    p.className = 'modal-content';
    p.textContent = content;
    box.appendChild(p);
  }
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  buttons.forEach((button) => {
    const b = document.createElement('button');
    b.className = button.primary ? 'modal-button primary' : 'modal-button';
    b.textContent = button.text;
    b.addEventListener('click', () => {
      root.innerHTML = '';
      if (button.onClick) button.onClick();
    });
    actions.appendChild(b);
  });
  box.appendChild(actions);
  overlay.appendChild(box);
  root.appendChild(overlay);
}

const wx = {
  getStorageSync(key) { return webStorage.get(key); },
  setStorageSync(key, value) { webStorage.set(key, value); },
  removeStorageSync(key) { webStorage.remove(key); },
  showModal({ title, content, confirmText = 'OK', success }) {
    showOverlay({
      title,
      content,
      buttons: [{ text: confirmText, primary: true, onClick: () => success && success({ confirm: true }) }]
    });
  },
  showActionSheet({ itemList = [], success }) {
    showOverlay({
      title: document.body.dataset.lang === 'en' ? 'Restart Options' : '重新开始',
      buttons: itemList.map((text, index) => ({
        text,
        primary: index === 0,
        onClick: () => success && success({ tapIndex: index })
      })).concat([{ text: document.body.dataset.lang === 'en' ? 'Cancel' : '取消' }])
    });
  }
};

let miniProgramPage = null;
function Page(config) {
  miniProgramPage = config;
}

const STORAGE_KEY = 'physics_darkroom_v5_plain_language'

// --- 资源系统常量 ---
const BASE_MAX_ENERGY = 6
const ENERGY_PER_CHAPTER = 2
const REST_ENERGY_MIN = 4
const REST_ENERGY_MAX = 9
const ACTION_ENERGY_COST = 1
const THEORY_ENERGY_COST = 2
const THEORY_MIN_ENERGY  = 3   // must have at least this much energy to propose a theory
const THEORY_MAX_DOUBT   = 3   // doubt must be at or below this to propose a theory
const DOUBT_LOCK = 4
const INSIGHT_SPARK = 3
const INSIGHT_REQUIRE = 2

function text(zh, en) {
  return { zh, en }
}

function pick(value, lang) {
  if (typeof value === 'string') return value
  return value[lang] || value.zh
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const UI = {
  reset: text('重新开始', 'Restart'),
  resetChapter: text('重开本章', 'Restart Chapter'),
  resetAll: text('从头开始', 'Restart All'),
  lang: text('English', '中文'),
  concepts: text('我发现的规律', 'My Discoveries'),
  log: text('记录本', 'Notebook'),
  complete: text('完成', 'Complete'),
  day: text('', 'Round '),
  roundSuffix: text('轮', ''),
  kinds: {
    theory: text('规律', 'Law'),
    experiment: text('实验', 'Experiment'),
    misconception: text('猜测', 'Guess'),
    intuition: text('猜测', 'Guess'),
    rest: text('休息', 'Rest')
  },
  resources: {
    energy: text('精力', 'Energy'),
    notes: text('记录', 'Notes'),
    insight: text('灵感', 'Insight'),
    doubt: text('困惑', 'Doubt')
  },
  resourceDesc: {
    energy: text('每次行动会消耗精力，休息可以恢复。', 'Each action costs energy. Rest to recover.'),
    notes: text('你已经留下的实验记录', 'The notes you have collected from experiments.'),
    insight: text('方向对的猜想会带来灵感。有些理论需要灵感才能提出。', 'Good guesses give insight. Some theories need insight before you can propose them.'),
    doubt: text('猜错会增加困惑。困惑太多时，先整理思路。', 'Guesses that are not supported by evidence increase doubt. Too much doubt makes it hard to continue, so organize your thoughts first.')
  },
  lowEnergy: text('精力不够了。先休息一下。', 'Not enough energy. Rest for a while first.'),
  insightLocked: text('还需要更多灵感', 'Needs more insight'),
  doubtConfused: text('困惑太多，暂时想不清楚。请先“整理思路”。', 'Too much doubt. Organize your thoughts before moving on.'),
  insightSpark: text('你的疑问开始连成一条线。现在可以把它变成新的灵感。', 'Your questions are starting to connect. You can turn them into new insight.'),
  completeTitle: text('物理世界建立完成', 'The Physics World Is Built'),
  completeScene: text(
    '你从最简单的运动开始，一步一步发现了力、电、磁、热、声、光、相对论、量子和核能。',
    'You started with simple motion and gradually discovered force, electricity, magnetism, heat, sound, light, relativity, quantum physics, and nuclear energy.'
  ),
  completeGoal: text(
    '游戏结束。但物理学真正的问题还在继续：这些知识应该怎样使用？',
    'The game is complete. But the real question remains: how should this knowledge be used?'
  )
}

const TUTORIAL = {
  title: text('怎么玩', 'How to Play'),
  html: text(
    `<p style="margin:0 0 12px;color:#eadfcb;line-height:1.7">你在一间暗室中醒来。这里没有普通的门，每一个问题都是一扇门。</p>
<p style="margin:0 0 12px;color:#eadfcb;line-height:1.7">你要做实验，提出猜想，也会犯错。每一次选择，都会让你更接近一个物理规律。</p>
<p style="margin:0 0 12px;color:#eadfcb;line-height:1.7">当你收集到足够的记录和灵感，就可以写下结论。真正发现规律时，暗室会亮一些，新的问题也会打开。</p>
<div style="padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.05);font-size:14px;line-height:1.6;color:#cfc6b4">提示：精力用完时就休息。困惑太多时，先整理思路。</div>`,
    `<p style="margin:0 0 12px;color:#eadfcb;line-height:1.7">You wake up in a dark room. There are no ordinary doors here. Every question is a door.</p>
<p style="margin:0 0 12px;color:#eadfcb;line-height:1.7">You will experiment, make guesses, and sometimes be wrong. Each choice brings you closer to a law of physics.</p>
<p style="margin:0 0 12px;color:#eadfcb;line-height:1.7">When you have enough notes and insight, you can write a conclusion. When you truly discover a law, the room becomes brighter and a new question opens.</p>
<div style="padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.05);font-size:14px;line-height:1.6;color:#cfc6b4">Tip: rest when you run out of energy. If doubt becomes too high, organize your thoughts first.</div>`
  )
}

const START_STATE = {
  lang: 'zh',
  chapter: 0,
  maxChapterReached: 0,
  maxEnergy: BASE_MAX_ENERGY,
  energy: BASE_MAX_ENERGY,
  day: 1,
  records: 0,
  insight: 0,
  doubt: 1,
  predictions: 0,
  facts: {},
  laws: {},
  actionOrder: [],
  complete: false,
  feedback: null,
  logs: [
    {
      time: 0,
      text: text(
        '你在暗室中醒来。桌上有一辆小车、几块木板和一个斜面。你的第一个问题很简单：小车为什么会停下来？',
        'You wake up in a dark room. On the table are a small cart, several boards, and a ramp. Your first question is simple: why does the cart stop?'
      )
    }
  ]
}
const CHAPTERS = [
  {
    title: text("伽利略：直觉会欺骗你", "Galileo: Intuition Can Mislead You"),
    label: text("第一问", "Q1"),
    question: text("小车被推一下后会停下来。它停下来的原因是什么？如果没有摩擦，它还会停吗？", "After a cart is pushed, it eventually stops. What makes it stop? If there were no friction, would it still stop?"),
    scene: text("桌上有一辆小车、粗糙的地板、光滑的木板和一个斜面。你要研究物体为什么会停下来——然后问：如果停不下来呢？", "On the table are a small cart, a rough floor, a smooth board, and a ramp. Study why objects stop — then ask: what if they couldn't?"),
    bridge: text("惯性告诉你：没有力，运动不会改变。那么力的大小和方向，是如何精确地改变运动的？", "Inertia tells you motion doesn't change without force. But how precisely does force change motion — and does mass play a role?")
  },
  {
    title: text("牛顿：力怎样改变运动？", "Newton: How Does Force Change Motion?"),
    label: text("第二问", "Q2"),
    question: text("如果力会改变运动，那么力、质量和加速度之间有什么关系？", "If force changes motion, how are force, mass, and acceleration related?"),
    scene: text("小车、砝码和计时工具出现在桌上。你要测试：同样的力作用在不同质量的物体上，会产生怎样不同的运动变化。", "A cart, weights, and timing tools appear on the table. Test how the same force changes the motion of objects with different masses."),
    bridge: text("F = ma 描述了力对单个物体的作用。但力从哪里来？当你推小车时，小车有没有在推你？", "F = ma describes how force acts on one object. But where does the force come from? When you push the cart, does the cart push back?")
  },
  {
    title: text("牛顿：力是不是单方面发生的？", "Newton: Is Force One-Sided?"),
    label: text("第三问", "Q3"),
    question: text("一个物体推另一个物体时，只有被推的物体受力吗？", "When one object pushes another, is only the second object affected?"),
    scene: text("两辆小车面对面，中间有弹簧和绳子。你要观察碰撞和拉绳，判断力是不是单向发生的。", "Two carts face each other with a spring and a rope nearby. Observe collisions and pulling to decide whether forces act only one way."),
    bridge: text("力总是成对出现。那么地球拉苹果落下，苹果是否也在拉地球？如果这个力是普遍的，它能不能延伸到月亮？", "Forces always come in pairs. Earth pulls the apple down — does the apple pull Earth too? And if this force is universal, does it reach all the way to the Moon?")
  },
  {
    title: text("牛顿：苹果和月亮有什么关系？", "Newton: What Connects the Apple and the Moon?"),
    label: text("第四问", "Q4"),
    question: text("苹果会落向地面，月亮却绕着地球。它们可能由同一种力控制吗？", "The apple falls to Earth, while the Moon orbits Earth. Could the same force explain both?"),
    scene: text("星图摊在桌上。你已经理解了地面上的运动，现在要把同样的想法用到天上的月亮。", "A star chart lies on the table. You understand motion on Earth; now apply the same ideas to the Moon."),
    bridge: text("你已经有了运动定律和引力定律。现在把它们放在一起——地上和天上，能不能用同一套规律统一解释？", "You have the laws of motion and the law of gravity. Now put them together — can Earth and sky be explained by the same system?")
  },
  {
    title: text("牛顿：把地上和天上写成同一套规律", "Newton: One System for Earth and Sky"),
    label: text("收束", "Closure"),
    question: text("地上的运动和天上的运动，能不能用同一套规律解释？", "Can motion on Earth and motion in space be explained by the same laws?"),
    scene: text("你的实验记录已经足够多。现在要把运动定律和引力放在一起，形成一套完整的力学体系。", "You now have enough notes. Combine the laws of motion and gravity into one system of mechanics."),
    bridge: text("力学体系建立了。但世界上还有一种力，不需要接触、看不见、摸不着——摩擦过的琥珀能吸起纸屑。这是完全不同的东西。", "Mechanics is complete. But there is another force in the world — invisible, acting without contact. Rubbed amber attracts paper scraps. This is something entirely different.")
  },
  {
    title: text("电荷：看不见的力", "Charge: An Invisible Force"),
    label: text("第五问", "Q5"),
    question: text("摩擦后的琥珀能吸起纸屑。不接触也能产生力吗？", "Rubbed amber attracts paper scraps. Can a force act without contact?"),
    scene: text("桌上出现琥珀、毛皮和纸屑。你要研究一种新的力：它看不见，却能隔空影响物体。", "Amber, fur, and paper scraps appear. Study a new force: invisible, but able to act across space."),
    bridge: text("静止的电荷会吸引和排斥。但如果电荷流动起来，变成电流，会发生什么？一根通了电的导线，会让旁边的磁针转动吗？", "Static charges attract and repel. But what happens when charge flows as current? Could a wire carrying current make a nearby compass needle turn?")
  },
  {
    title: text("奥斯特：电流为什么能转动磁针？", "Oersted: Why Does Current Turn a Compass?"),
    label: text("第六问", "Q6"),
    question: text("电流通过导线时，为什么旁边的磁针会转动？", "Why does a compass turn when current flows through a wire?"),
    scene: text("电池、导线和指南针出现在桌上。你要测试电流和磁现象之间是否有关联。", "A battery, a wire, and a compass appear. Test whether electric current and magnetism are connected."),
    bridge: text("电流能产生磁。那么反过来呢——磁能不能产生电流？", "Current produces magnetism. But can the reverse work — can magnetism produce current?")
  },
  {
    title: text("法拉第：变化为什么能产生电？", "Faraday: Why Does Change Create Electricity?"),
    label: text("第七问", "Q7"),
    question: text("磁铁靠近线圈时能产生电流。关键是磁铁，还是磁场的变化？", "A magnet near a coil can produce current. Is the key the magnet itself, or the change in magnetic field?"),
    scene: text("线圈、电流表和磁铁出现在桌上。你要观察什么时候有电流，什么时候没有。", "A coil, meter, and magnet appear. Observe when current appears and when it does not."),
    bridge: text("变化的磁场产生电场，变化的电场产生磁场。它们能不能相互推动，在真空中以波的形式传播出去？", "A changing magnetic field produces an electric field, and vice versa. Could they sustain each other — propagating as a wave through empty space?")
  },
  {
    title: text("麦克斯韦：光是不是电磁波？", "Maxwell: Is Light an Electromagnetic Wave?"),
    label: text("第八问", "Q8"),
    question: text("电场和磁场能不能互相产生，并像波一样传播？", "Can electric and magnetic fields produce each other and travel as waves?"),
    scene: text("你开始不只研究物体，也研究空间中的场。现在的问题是：光会不会就是一种电磁波？", "You now study fields in space, not just objects. The question is: could light be an electromagnetic wave?"),
    bridge: text("电磁理论建立了。但方程不只是方程——电动机、发电机、灯泡，这些都在等待被发明出来。", "The theory of electromagnetism is complete. But equations aren't just equations — motors, generators, and light bulbs are all waiting to be built.")
  },
  {
    title: text("电的机器：让规律变成力量", "Electrical Machines: Turning Laws into Power"),
    label: text("第九问", "Q9"),
    question: text("电和磁的规律能不能变成真正有用的机器？", "Can the laws of electricity and magnetism become useful machines?"),
    scene: text("桌上有线圈、磁铁、铁芯、转轴和灯泡。你要制造电动机和发电机，看能量怎样转换。", "Coils, magnets, iron cores, axles, and a bulb appear. Build motors and generators to see how energy changes form."),
    bridge: text("电流能沿导线传输，能点亮灯泡。但它能不能摆脱导线，把信息直接送到远处？", "Electric current travels through wires and lights bulbs. But can it break free of wires and carry information through the air?")
  },
  {
    title: text("赫兹：信息能不能离开导线？", "Hertz: Can Information Leave the Wire?"),
    label: text("第十问", "Q10"),
    question: text("电磁波能不能离开导线，把信息传到远方？", "Can electromagnetic waves leave wires and carry information far away?"),
    scene: text("火花、天线和接收器出现了。你要把电磁波变成可以传递信息的工具。", "Sparks, antennas, and receivers appear. Turn electromagnetic waves into tools for communication."),
    bridge: text("你看到了电能、机械能、光和热之间的转换。它们是同一种东西的不同形式吗？转换过程中，有什么始终不变？", "You've seen electricity, motion, light, and heat transform into one another. Are they all forms of the same thing? And what, if anything, is conserved in these transformations?")
  },
  {
    title: text("焦耳：热和功是不是同一种东西？", "Joule: Are Heat and Work Connected?"),
    label: text("第十一问", "Q11"),
    question: text("蒸汽能推动活塞。热是一种物质，还是能量的一种形式？", "Steam can push a piston. Is heat a substance, or a form of energy?"),
    scene: text("水壶、桨叶和蒸汽机模型出现在桌上。你要研究热怎样和机械功互相转化。", "A kettle, paddle wheel, and steam engine model appear. Study how heat and mechanical work transform into each other."),
    bridge: text("能量守恒了。但热机总是会「浪费」一部分热，怎么做都无法完全避免。这不只是工程问题——它暗示着时间本身有方向。", "Energy is conserved. But heat engines always waste some heat, no matter how well built. This isn't just an engineering problem — it hints that time itself has a direction.")
  },
  {
    title: text("熵：为什么时间有方向？", "Entropy: Why Does Time Have a Direction?"),
    label: text("第十二问", "Q12"),
    question: text("如果能量守恒，为什么热机还是不能百分百有效？", "If energy is conserved, why can no heat engine be 100% efficient?"),
    scene: text("你已经知道能量不会消失。但热机总会浪费一部分热。现在要研究效率、熵和时间方向。", "You know energy is conserved, but heat engines always waste some heat. Study efficiency, entropy, and the direction of time."),
    bridge: text("热是粒子的无序运动。那么有序的振动呢？桌上的音叉敲响，声音是怎样穿过空气传到你耳朵的？", "Heat is disordered particle motion. What about ordered vibration? When a tuning fork rings, how does the sound travel through air to reach your ear?")
  },
  {
    title: text("声音：空气怎样把振动带到耳朵？", "Sound: How Does Air Carry Vibration?"),
    label: text("第十三问", "Q13"),
    question: text("声音怎样从物体传到耳朵？它是不是一种波？", "How does sound travel from an object to your ear? Is it a wave?"),
    scene: text("音叉、钟罩和共振装置出现了。你要找出声音传播需要什么，以及到底是什么在振动。", "A tuning fork, bell jar, and resonance tools appear. Find out what sound needs to travel and what is vibrating."),
    bridge: text("声波需要介质传播。光也是波吗？光穿过棱镜、透镜，还能发生干涉——这一切能不能用波动来解释？", "Sound needs a medium to travel. Is light also a wave? Light bends through prisms, focuses through lenses, and produces interference patterns — can all of this be explained as wave behavior?")
  },
  {
    title: text("光：它像粒子，还是像波？", "Light: Particle or Wave?"),
    label: text("第十四问", "Q14"),
    question: text("光会折射、成像、分色和干涉。它到底怎样传播？", "Light refracts, forms images, splits into colors, and interferes. How does it travel?"),
    scene: text("棱镜、透镜和双缝装置出现在桌上。你要收集证据，判断光是否像波一样传播。", "A prism, lens, and double-slit setup appear. Gather evidence to decide whether light behaves like a wave."),
    bridge: text("光是电磁波，以固定速度传播。但相对于什么静止？如果你追着光跑，光速会变慢吗？这个问题让一切都不对劲了。", "Light is an electromagnetic wave that travels at a fixed speed. But fixed relative to what? If you chased a beam of light, would it slow down? This question breaks everything.")
  },
  {
    title: text("爱因斯坦：如果追上一束光会怎样？", "Einstein: What If You Chased Light?"),
    label: text("第十五问", "Q15"),
    question: text("如果你追着一束光跑，会看到什么？", "What would you see if you chased a beam of light?"),
    scene: text("光速实验和时钟出现在桌上。你要重新思考速度、时间和空间。", "Light-speed experiments and clocks appear. Rethink speed, time, and space."),
    bridge: text("狭义相对论处理了匀速运动。但引力呢？在自由下落的电梯里，你感觉不到重力——也许引力和加速度根本是同一回事。", "Special relativity handles constant-speed motion. But what about gravity? In a freely falling elevator, you feel no weight — perhaps gravity and acceleration are the same thing.")
  },
  {
    title: text("爱因斯坦：引力是不是弯曲的时空？", "Einstein: Is Gravity Curved Spacetime?"),
    label: text("第十六问", "Q16"),
    question: text("引力只是普通的力，还是时空本身弯曲的结果？", "Is gravity an ordinary force, or the result of curved spacetime?"),
    scene: text("自由下落的电梯、太阳和星光的图像出现了。你要测试一个新想法：质量会改变时空的形状。", "A falling elevator, the Sun, and starlight diagrams appear. Test a new idea: mass changes the shape of spacetime."),
    bridge: text("你理解了宇宙的大尺度结构。现在把目光转向极小的尺度——原子内部有什么？它不是实心的小球。", "You understand the large-scale structure of the cosmos. Now turn to the very small — what is inside an atom? It's not a solid sphere.")
  },
  {
    title: text("卢瑟福：原子里面到底有什么？", "Rutherford: What Is Inside the Atom?"),
    label: text("第十七问", "Q17"),
    question: text("原子真的是不可分割的小球吗？", "Is the atom really an indivisible small sphere?"),
    scene: text("阴极射线管、金箔和油滴实验装置出现了。你要研究原子内部是否还有更小的结构。", "A cathode ray tube, gold foil, and oil drop setup appear. Study whether atoms contain smaller structures."),
    bridge: text("原子有核有电子。但加热金属时，它发出特定颜色的光——经典物理完全解释不了这个现象。能量也许不是连续的？", "The atom has a nucleus and electrons. But heated metal emits specific colors of light — classical physics cannot explain this at all. Could energy itself be non-continuous?")
  },
  {
    title: text("普朗克：能量是不是一份一份的？", "Planck: Does Energy Come in Packets?"),
    label: text("第十八问", "Q18"),
    question: text("经典物理解释不了热辐射和光电效应。能量可能不是连续的吗？", "Classical physics cannot explain blackbody radiation and the photoelectric effect. Could energy be non-continuous?"),
    scene: text("黑体辐射和光电效应实验出现了。你要研究光的能量是否是一份一份的。", "Blackbody radiation and photoelectric experiments appear. Study whether light energy comes in packets."),
    bridge: text("光既是波又是粒子。物质呢？电子有没有波动性？如果有，微观世界的「轨道」这个概念还成立吗？", "Light is both wave and particle. What about matter? Do electrons have wave properties? If so, does the very concept of an 'orbit' still make sense at the microscopic scale?")
  },
  {
    title: text("量子世界：为什么只能谈概率？", "The Quantum World: Why Probability?"),
    label: text("第十九问", "Q19"),
    question: text("电子有确定轨道吗，还是只能用概率描述？", "Do electrons have definite orbits, or can we only describe them with probability?"),
    scene: text("原子光谱、电子波和测量装置出现了。你要研究微观世界为什么不能再用普通轨道来描述。", "Atomic spectra, electron waves, and measuring tools appear. Study why the microscopic world cannot be described with ordinary orbits."),
    bridge: text("量子力学描述了电子。现在把它用到原子核上——核力是什么？核能有没有办法释放？这个答案将改变整个世界。", "Quantum mechanics describes electrons. Now apply it to the nucleus — what is nuclear force? Can nuclear energy be released? The answer will change the world.")
  },
  {
    title: text("核能：知识走到选择的路口", "Nuclear Energy: Knowledge at a Crossroads"),
    label: text("第二十问", "Q20"),
    question: text("如果原子核能裂变，释放出的巨大能量应该怎样使用？", "If nuclei can split and release huge energy, how should that energy be used?"),
    scene: text("云室、铀核和链式反应模型出现了。你要理解核能，也要面对物理知识带来的人类选择。", "A cloud chamber, uranium nucleus, and chain reaction model appear. Understand nuclear energy and the human choices it creates.")
  }
]
const ACTIONS = [
  {
    id: 'push_cart_rough',
    type: 'experiment',
    chapter: 0,
    label: text('我先推一下小车，看看它为什么会停下来。', 'I push the cart once and watch why it stops.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.stopped = true
      return text(
        '小车在粗糙地面上滑了一会儿，慢慢停下。你的手早就离开了它。真正让它停下来的，可能不是“没有推力”，而是地面的摩擦。',
        'The cart slides across the rough floor and slowly stops. Your hand left it long ago. Maybe it stopped not because the push disappeared, but because the floor kept rubbing against it.'
      )
    }
  },
  {
    id: 'compare_surfaces',
    type: 'experiment',
    chapter: 0,
    label: text('我换一块更光滑的木板，再试一次。', 'I try again on a smoother board.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，困惑 +1。', 'Spend 1 energy. You gain 1 note. Doubt +1.'),
    cost: 1,
    requires: (s) => s.facts.stopped,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.smoothSlides = true
      return text(
        '换成光滑木板后，小车滑得更远。你开始看见一个线索：摩擦越小，运动持续得越久。如果完全没有摩擦呢？',
        'On the smooth board, the cart travels much farther. A clue appears: less friction means motion lasts longer. What if there were no friction at all?'
      )
    }
  },
  {
    id: 'ramp_friction',
    type: 'experiment',
    chapter: 0,
    label: text('我用斜面做实验，看看摩擦变小时会发生什么。', "I use a ramp to see what happens when friction becomes smaller."),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.smoothSlides,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.rampIdeal = true
      return text(
        '斜面越光滑，小球滚得越远。伽利略提醒你：继续想下去。如果没有摩擦，小球就没有理由停下。也许运动不需要一直被推动，停止才需要原因。',
        'The smoother the ramp, the farther the ball rolls. Galileo asks you to follow the idea to its limit: if there were no friction, the ball would have no reason to stop. Maybe motion does not need a constant push; stopping needs a cause.'
      )
    }
  },
  {
    id: 'wrong_needs_force',
    type: 'misconception',
    chapter: 0,
    label: text('我猜：物体必须一直被推，才会继续运动。', 'I guess: an object must keep being pushed to keep moving.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', "This is a guess. Try it and see if it points in the right direction."),
    cost: 1,
    requires: (s) => s.facts.stopped && !s.facts.smoothSlides,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '亚里士多德也这样认为。但看光滑地面——力消失了，运动还在继续。是力维持了运动，还是摩擦力终结了运动？',
        'Aristotle thought so too. But look at the smooth surface — the push is gone, yet motion continues. Is force what maintains motion, or is friction what ends it?'
      )
      return text(
        '你写下：“运动需要持续的力。”可是木板上的小车还在滑行。你的手已经离开了它，这个现象正在提醒你：这个猜想还不够。',
        'You write: “motion needs a continuous force.” But the cart is still gliding after your hand has left it. The experiment is telling you that this guess is not enough.'
      )
    }
  },
  {
    id: 'extrapolate_no_friction',
    type: 'intuition',
    chapter: 0,
    label: text('我猜：如果没有摩擦，物体可能会一直运动下去。', 'I guess: without friction, an object may keep moving forever.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', "This is a guess. Try it and see if it points in the right direction."),
    cost: 1,
    requires: (s) => s.facts.smoothSlides && !s.facts.rampIdeal,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '这正是伽利略的灵感：没有摩擦力，就没有理由停下来。运动是物体的自然状态。把这个想法写成规律——就是惯性定律。',
        "This is exactly Galileo's reasoning: without friction, there is no reason to stop. Motion is the natural state. Write this as a law — and you have the law of inertia."
      )
      return text(
        '你在纸上画出一条直线，一直延伸到纸外。没有摩擦，就没有明显的理由让它停下。你第一次感觉到：运动本身可能就是一种自然状态。',
        'You draw a straight line that runs beyond the edge of the page. Without friction, there is no clear reason for it to stop. For the first time, motion itself feels natural.'
      )
    }
  },
  {
    id: 'law_inertia',
    type: 'theory',
    chapter: 0,
    label: text('写下我的结论：没有外力，运动状态不会自己改变。', 'I write my conclusion: without an external force, motion does not change by itself.'),
    hint: text('需要 1 点精力。条件：完成斜面实验，拥有 3 条记录和 1 点灵感。', 'Spend 1 energy. Needs the ramp experiment, 3 notes, and 1 insight'),
    cost: 1,
    requires: (s) => s.facts.rampIdeal && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.inertia = true
      s.chapter = 1
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下惯性定律：物体不会自己改变运动状态。摩擦让小车停下，但运动本身没有终点。没有外力时，物体会保持静止或匀速直线运动。',
        'You write the law of inertia: objects do not change their own motion. Friction makes them stop — motion itself has no endpoint. Without external force, motion continues forever. Galileo\'s extrapolation becomes Newton\'s law.'
      )
    }
  },
  {
    id: 'push_cart',
    type: 'experiment',
    chapter: 1,
    label: text('我轻轻推小车，观察它的速度怎样改变。', 'I gently push the cart and watch how its speed changes.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.push = true
      return text(
        '你轻推小车，小车的速度发生改变。你记录：力会改变物体的运动。',
        'You nudge the cart, and its speed changes. You write: force changes motion.'
      )
    }
  },
  {
    id: 'wrong_push_forever',
    type: 'misconception',
    chapter: 1,
    label: text('我猜：小车必须一直被推，才会继续运动。', 'I guess: the cart must keep being pushed to keep moving.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.push,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：手离开后，小车仍会滑行。力也许不是“维持运动”，而是“改变运动”。',
        'Counterexample: after your hand leaves, the cart still glides. Force may not be what maintains motion; it may be what changes motion.'
      )
      return text(
        '你猜小车必须一直被推才会运动。可是它离手后还滑了一段，像是在反驳你。',
        'You guess the cart must be pushed continuously to move. But after your hand leaves, it still glides on, arguing back.'
      )
    }
  },
  {
    id: 'vary_force',
    type: 'experiment',
    chapter: 1,
    label: text('我加大推力，看看速度是不是改变得更快。', 'I push harder and see whether the speed changes faster.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.forceChange = true
      return text(
        '推力越大，小车速度改变得越快。你开始关注“加速度”。',
        'A larger force changes the cart’s speed faster. You begin to focus on acceleration.'
      )
    }
  },
  {
    id: 'add_mass',
    type: 'experiment',
    chapter: 1,
    label: text('我给小车加重，再用同样的力推它。', 'I add mass to the cart and push it with the same force.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，困惑 +1。', 'Spend 1 energy. You gain 1 note. Doubt +1.'),
    cost: 1,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.mass = true
      return text(
        '小车加重后，同样的推力产生的加速度变小。质量越大，越难改变运动。',
        'With more mass, the same force produces less acceleration. More mass means motion is harder to change.'
      )
    }
  },
  {
    id: 'invent_calculus',
    type: 'experiment',
    chapter: 1,
    label: text('我把运动分成很短的时间，观察每一刻的变化。', 'I break the motion into tiny time intervals and observe each change.'),
    hint: text('需要 2 点精力。完成后得到 1 条记录、1 点灵感和 1 次预测。', 'Spend 2 energy. You gain 1 note, 1 insight, and 1 prediction.'),
    cost: 2,
    requires: (s) => s.facts.forceChange && s.facts.mass,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.predictions += 1
      s.facts.calculus = true
      return text(
        '你把运动分成很短的时间间隔，开始研究每一瞬间速度怎样变化。这种方法让你记录下运动的精确形状。',
        'You divide motion into very small time intervals and study how speed changes at each instant. This approach lets you record the exact shape of motion.'
      )
    }
  },
  {
    id: 'wrong_average_only',
    type: 'misconception',
    chapter: 1,
    label: text('我猜：也许只看平均速度就够了。', 'I guess: maybe average speed is enough.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.forceChange && s.facts.mass && !s.facts.calculus,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：平均速度会把一段运动抹平。要描述力怎样改变运动，你需要看每一瞬间的变化。',
        'Counterexample: average speed smooths a whole motion into one number. To describe how force changes motion, you need the change at each instant.'
      )
      return text(
        '你试着只用平均速度解释小车。纸上的曲线变得模糊，像被手掌抹过。',
        'You try to explain the cart using only average speed. The curve on the page blurs, as if wiped by a hand.'
      )
    }
  },
  {
    id: 'law_second',
    type: 'theory',
    chapter: 1,
    label: text('写下我的结论：力、质量和加速度满足 F = ma。', 'I write my conclusion: force, mass, and acceleration follow F = ma.'),
    hint: text('需要 1 点精力。条件：理解推力、质量和瞬时变化，拥有 4 条记录和 2 点灵感。', 'Spend 1 energy. Needs force, mass, instant-by-instant change, 4 notes, and 2 insight'),
    cost: 1,
    requires: (s) => s.facts.forceChange && s.facts.mass && s.facts.calculus && s.records >= 4 && s.insight >= 2,
    run(s) {
      s.records -= 4
      s.insight -= 2
      s.laws.second = true
      s.chapter = 2
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你总结出第二定律：合力等于质量乘以加速度，F = ma。',
        'You discover Newton’s second law: net force equals mass times acceleration, F = ma.'
      )
    }
  },
  {
    id: 'collide_carts',
    type: 'experiment',
    chapter: 2,
    label: text('我让两辆小车相撞，观察双方怎样运动。', 'I let two carts collide and watch how both of them move.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录', 'Spend 2 energy. You gain 2 notes.'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.facts.collision = true
      return text(
        '两辆小车相撞后，两个小车的运动都改变了。你记录：相互作用会影响双方。',
        'After two carts collide, both carts change their motion. Interaction affects both objects.'
      )
    }
  },
  {
    id: 'wrong_one_way_force',
    type: 'misconception',
    chapter: 2,
    label: text('我猜：力可能只作用在被推的一方。', 'I guess: maybe only the object being pushed feels the force.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.collision && !s.facts.rope,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：被撞的小车动了，撞它的小车也退了。力的箭头少画了一半。',
        'Counterexample: the struck cart moves, and the striking cart rolls back. Half the force arrows are missing.'
      )
      return text(
        '你把箭头只画向一边。小车退回来的痕迹提醒你：另一个箭头被你漏掉了。',
        'You draw the arrow only one way. The cart rolling back reminds you: you missed the other arrow.'
      )
    }
  },
  {
    id: 'pull_rope',
    type: 'experiment',
    chapter: 2,
    label: text('我拉一根绳子，感受绳子是不是也在拉我。', 'I pull a rope and feel whether the rope pulls me back.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，灵感 +1。', 'Spend 1 energy. You gain 1 note. Insight +1.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.rope = true
      return text(
        '你拉绳子时，绳子也在拉你。力似乎总是成对出现。',
        'When you pull the rope, the rope pulls you back. Forces seem to come in pairs.'
      )
    }
  },
  {
    id: 'measure_pair_force',
    type: 'experiment',
    chapter: 2,
    label: text('我测量绳子两端的力，看看它们是否一样大。', 'I measure both ends of the rope to see whether the forces are equal.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.rope,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.equalPair = true
      return text(
        '你在绳子两端各接一个弹簧秤。两边读数一起抖动，最后停在同一个数上。',
        'You attach a spring scale to each end of the rope. Both readings tremble, then settle on the same number.'
      )
    }
  },
  {
    id: 'wrong_pair_not_equal',
    type: 'misconception',
    chapter: 2,
    label: text('我猜：反作用力可能比作用力小一些。', 'I guess: the reaction force might be weaker.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.rope && !s.facts.equalPair,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：只知道力成对还不够。你需要比较两端大小，否则“反作用力较小”只是直觉。',
        'Counterexample: knowing forces come in pairs is not enough. Compare both ends, or "the reaction is weaker" is only intuition.'
      )
      return text(
        '你写下“反作用力也许小一些”。绳子绷得笔直，像在要求你量一量再说。',
        'You write, "maybe the reaction is weaker." The taut rope seems to demand a measurement.'
      )
    }
  },
  {
    id: 'law_third',
    type: 'theory',
    chapter: 2,
    label: text('写下我的结论：两个物体相互作用时，力总是成对出现。', 'I write my conclusion: when two objects interact, forces come in pairs.'),
    hint: text('需要 1 点精力。条件：完成碰撞、拉绳和两端测量，拥有 5 条记录和 1 点灵感。', 'Spend 1 energy. Needs collision, rope, equal readings, 5 notes, and 1 insight'),
    cost: 1,
    visible: (s) => s.facts.equalPair,
    requires: (s) => s.facts.collision && s.facts.rope && s.facts.equalPair && s.records >= 5 && s.insight >= 1,
    run(s) {
      s.records -= 5
      s.insight -= 1
      s.laws.third = true
      s.chapter = 3
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你发现第三定律：两个物体相互作用时，它们受到大小相等、方向相反的力。',
        'You discover the third law of motion: when two objects interact, they exert equal and opposite forces on each other.'
      )
    }
  },
  {
    id: 'read_moon',
    type: 'experiment',
    chapter: 3,
    label: text('我观察月亮的位置，思考它为什么没有掉下来。', 'I observe the Moon and wonder why it does not fall to Earth.'),
    hint: text('需要 1 点精力。这个选择会增加困惑。引发深层思考。', 'Spend 1 energy. This raises a useful question.'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.moon = true
      return text(
        '月亮的方向一直在改变，但它没有撞上地球。你开始怀疑：月亮也许一直在向地球“下落”。',
        'The Moon keeps changing direction but does not hit Earth. You suspect it may be constantly “falling” toward Earth.'
      )
    }
  },
  {
    id: 'wrong_moon_free',
    type: 'intuition',
    chapter: 3,
    label: text('我猜：月亮也许一直在下落，只是不断错过地球。', 'I guess: maybe the Moon is falling, but keeps missing Earth.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.moon,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '反例：月亮的方向每晚都在变。它不是不下落，而是一直错过地面。',
        'Counterexample: the Moon changes direction every night. It is not refusing to fall; it keeps missing Earth.'
      )
      return text(
        '你写下“月亮没有下落”。星图上的弯曲轨迹却轻轻敲了敲桌面。',
        'You write, "the Moon is not falling." The curved path on the star chart quietly taps the table.'
      )
    }
  },
  {
    id: 'estimate_curve',
    type: 'experiment',
    chapter: 3,
    label: text('我计算月亮轨道的弯曲，看看它是否真的在下落。', 'I calculate the curve of the Moon’s path to see whether it is falling.'),
    hint: text('需要 2 点精力。完成后得到 1 次预测，灵感 +1。', 'Spend 2 energy. You gain 1 prediction and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.moon,
    once: true,
    run(s) {
      s.predictions += 1
      s.insight += 1
      s.facts.curve = true
      return text(
        '你画出月亮的弯曲轨道。它一直向地球弯曲运动，但横向速度让它不断错过地球。',
        'You draw the Moon’s curved path. It falls toward Earth, but its sideways speed keeps making it miss.'
      )
    }
  },
  {
    id: 'compare_earth_sky',
    type: 'experiment',
    chapter: 3,
    label: text('我把苹果下落和月亮绕行放在一起比较。', 'I compare a falling apple with the orbiting Moon.'),
    hint: text('需要 2 点精力。完成后得到 1 次预测和 1 条记录。', 'Spend 2 energy. You gain 1 prediction and 1 note.'),
    cost: 2,
    requires: (s) => s.facts.curve && s.laws.second,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.sameGravity = true
      return text(
        '你把苹果下落和月亮绕行放在一起比较。它们可能都受到地球引力影响。',
        'You compare the falling apple with the orbiting Moon. Both may be affected by Earth’s gravity.'
      )
    }
  },
  {
    id: 'law_gravity',
    type: 'theory',
    chapter: 3,
    label: text('写下我的结论：任何两个有质量的物体都会相互吸引。', 'I write my conclusion: any two masses attract each other.'),
    hint: text('需要 1 点精力。条件：完成地月比较，拥有 2 次预测和 1 点灵感。', 'Spend 1 energy. Needs the Earth–Moon comparison, 2 predictions, and 1 insight'),
    cost: 1,
    requires: (s) => s.facts.sameGravity && s.predictions >= 2 && s.insight >= 1,
    run(s) {
      s.predictions -= 2
      s.insight -= 1
      s.laws.gravity = true
      s.chapter = 4
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你提出万有引力：任何两个有质量的物体都会相互吸引。',
        'You propose universal gravitation: every mass attracts every other mass.'
      )
    }
  },
  {
    id: 'write_principia',
    type: 'theory',
    chapter: 4,
    label: text('我把三条运动定律和万有引力整理成一套体系。', 'I put the three laws of motion and gravity into one system.'),
    hint: text('需要 1 点精力。条件：完成三条运动定律和万有引力。', 'Spend 1 energy. Needs the three laws and gravity.'),
    cost: 1,
    requires: (s) => s.laws.inertia && s.laws.second && s.laws.third && s.laws.gravity,
    run(s) {
      s.records = Math.max(0, s.records - 2)
      s.laws.principia = true
      s.chapter = 5
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你合上《原理》。地上的碰撞、桌上的小车、天上的月亮，终于说起同一种语言。墙后，磁针轻轻偏了一下。',
        'You close the Principia. Collisions on the floor, carts on the table, and the Moon in the sky finally speak the same language. Behind the wall, a compass needle twitches.'
      )
    }
  },
  {
    id: 'rub_amber',
    type: 'experiment',
    chapter: 5,
    label: text('我摩擦琥珀，观察纸屑为什么会被吸起来。', 'I rub amber and watch why paper scraps are attracted.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，困惑 +1。', 'Spend 1 energy. You gain 1 note. Doubt +1.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.amber = true
      return text(
        '琥珀擦过毛皮后，纸屑忽然竖起来，像听见了无声的召唤。',
        'After amber is rubbed with fur, paper scraps stand up as if hearing a silent call.'
      )
    }
  },
  {
    id: 'wrong_contact_only',
    type: 'misconception',
    chapter: 5,
    label: text('我猜：力必须接触物体，才能产生作用。', 'I guess: a force must touch an object to act on it.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.amber && !s.facts.chargePair,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：纸屑还没碰到琥珀就动了。这里也许有一种隔空影响。',
        'Counterexample: the paper moves before touching the amber. Some influence is reaching across space.'
      )
      return text(
        '你写下“必须接触”。纸屑在空中抖了一下，像在嘲笑这句话。',
        'You write, "contact is required." A paper scrap trembles in the air, as if laughing at the sentence.'
      )
    }
  },
  {
    id: 'compare_charges',
    type: 'experiment',
    chapter: 5,
    label: text('我比较吸引和排斥，寻找背后的规律。', 'I compare attraction and repulsion to find the pattern.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.amber,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.chargePair = true
      return text(
        '有些东西靠近，有些东西躲开。电不只是“吸引”，它像有两种性格。',
        'Some things draw closer; others move away. Electricity is not just attraction; it seems to have two temperaments.'
      )
    }
  },
  {
    id: 'law_charge',
    type: 'theory',
    chapter: 5,
    label: text('写下我的结论：电荷有两种，同种相斥，异种相吸。', 'I write my conclusion: there are two kinds of charge; like charges repel, unlike charges attract.'),
    hint: text('需要 1 点精力。条件：观察吸引和排斥，拥有 3 条记录和 1 点灵感。', 'Spend 1 energy. Needs attraction and repulsion evidence, 3 notes, and 1 insight'),
    cost: 1,
    visible: (s) => s.facts.chargePair,
    requires: (s) => s.facts.chargePair && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.charge = true
      s.chapter = 6
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你给这种隔空的电性起了名字：电荷。同类相斥，异类相吸，暗室里多了一种看不见的秩序。',
        'You give this electric property a name: charge. Like repels like; unlike attracts unlike. Another invisible order enters the room.'
      )
    }
  },
  {
    id: 'close_circuit',
    type: 'experiment',
    chapter: 6,
    label: text('我接通电路，观察导线里发生了什么。', 'I connect the circuit and observe what happens inside the wire.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.current = true
      return text(
        '导线接上电池，金属没有发光，却像有东西在里面流动。',
        'The wire is connected to the battery. The metal does not glow, yet something seems to flow inside it.'
      )
    }
  },
  {
    id: 'compass_near_wire',
    type: 'experiment',
    chapter: 6,
    label: text('我把磁针放到通电导线旁边。', 'I place a compass beside a current-carrying wire.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.current,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.oersted = true
      return text(
        '电流经过时，磁针偏了一下。电和磁第一次在同一个实验里相遇。',
        'When current passes, the compass needle turns. Electricity and magnetism meet in the same experiment for the first time.'
      )
    }
  },
  {
    id: 'wrong_electric_magnetic_separate',
    type: 'intuition',
    chapter: 6,
    label: text('我猜：电和磁也许不是两件完全不同的事。', 'I guess: electricity and magnetism may not be separate things.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.current && !s.facts.oersted,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '你在两页纸之间犹豫：电荷的力，磁铁的场——它们为什么不能出现在同一个实验里？把磁针放到通电导线旁边，看看它会不会转动。',
        'You pause between two pages: electric force, magnetic field — what if they belong on the same page? Put a compass by the wire and see if it turns.'
      )
      return text(
        '你忽然意识到：奥斯特 1820 年的那次公开演示不是意外。也许电流和磁场本来就是同一种东西的两张脸。',
        'It strikes you: Oersted\'s 1820 demonstration was no accident. Perhaps electric current and magnetic field are two faces of the same thing.'
      )
    }
  },
  {
    id: 'law_currentMagnetism',
    type: 'theory',
    chapter: 6,
    label: text('写下我的结论：电流周围会产生磁场。', 'I write my conclusion: an electric current creates a magnetic field.'),
    hint: text('需要 1 点精力。条件：观察磁针偏转，拥有 3 条记录和 1 点灵感。', 'Spend 1 energy. Needs compass deflection, 3 notes, and 1 insight'),
    cost: 1,
    visible: (s) => s.facts.oersted,
    requires: (s) => s.facts.oersted && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.currentMagnetism = true
      s.chapter = 7
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下：电流会产生磁效应。导线周围不再是空的，而像有看不见的旋涡。',
        'You discover that an electric current produces a magnetic field. The space around the wire is no longer empty; it carries a circular magnetic pattern.'
      )
    }
  },
  {
    id: 'move_magnet_coil',
    type: 'experiment',
    chapter: 7,
    label: text('我移动磁铁穿过线圈，看看会不会产生电流。', 'I move a magnet through a coil to see whether it creates current.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.induction = true
      return text(
        '磁铁一动，线圈里的指针也动。磁铁一运动，线圈里就出现电流。',
        'When the magnet moves, the needle connected to the coil moves too. When the magnet moves, current appears in the coil.'
      )
    }
  },
  {
    id: 'wrong_static_magnet_current',
    type: 'misconception',
    chapter: 7,
    label: text('我猜：只要磁铁足够强，放着不动也能发电。', 'I guess: a strong magnet might generate current even when it is not moving.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.induction && !s.facts.changeMatters,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：磁铁停住时，指针也安静下来。这里真正关键的不是磁铁，而是变化。',
        'Counterexample: when the magnet stops, the needle rests too. The key is not the magnet by itself, but change.'
      )
      return text(
        '你把磁铁停在线圈旁边，等电流自己出现。桌面安静下来，指针一动不动。',
        'You hold the magnet still beside the coil and wait for current. The table grows quiet, and the needle does not move.'
      )
    }
  },
  {
    id: 'reverse_motion',
    type: 'experiment',
    chapter: 7,
    label: text('我让磁铁反向移动，观察电流方向是否改变。', 'I move the magnet the other way and watch whether the current reverses.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，预测 +1。', 'Spend 1 energy. You gain 1 note. Prediction +1.'),
    cost: 1,
    requires: (s) => s.facts.induction,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.changeMatters = true
      return text(
        '磁铁反向移动，指针也反向偏转。线圈响应的不是“磁铁放在那里”，而是“磁场正在变化”。',
        'Move the magnet the other way, and the needle turns the other way. The coil responds not to a magnet sitting there, but to a changing magnetic field.'
      )
    }
  },
  {
    id: 'law_induction',
    type: 'theory',
    chapter: 7,
    label: text('写下我的结论：变化的磁场会产生感应电流。', 'I write my conclusion: a changing magnetic field induces current.'),
    hint: text('需要 1 点精力。条件：理解“变化”的作用，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs change, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.changeMatters,
    requires: (s) => s.facts.changeMatters && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.induction = true
      s.chapter = 8
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下：变化的磁场会生出电流。你发现：变化的磁场可以产生电流。暗室里又亮起一小片。',
        'You write it down: a changing magnetic field calls a current out of stillness. You discover that a changing magnetic field can produce current. Another part of the dark room lights up.'
      )
    }
  },
  {
    id: 'draw_fields',
    type: 'experiment',
    chapter: 8,
    label: text('我画出场线，想象空间中看不见的结构。', 'I draw field lines and imagine the invisible structure of space.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism && s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fields = true
      return text(
        '你不再只画物体，而开始画空间本身。线条穿过空处，像给看不见的东西铺路。',
        'You stop drawing only objects and begin drawing space itself. Lines cross empty regions like roads for the invisible.'
      )
    }
  },
  {
    id: 'wrong_light_separate',
    type: 'intuition',
    chapter: 8,
    label: text('我猜：光也许就是一种电磁波。', 'I guess: light may be an electromagnetic wave.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.fields && !s.facts.lightSpeed,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '你把麦克斯韦方程的传播速度算了出来：约 3×10⁸ 米/秒。桌上有一本测量光速的旧记录——数字几乎一模一样。这个巧合不肯安静。',
        'You calculate the propagation speed from Maxwell\'s equations: roughly 3×10⁸ m/s. An old record of measured light speed lies on the table — the numbers are nearly identical. This cannot be coincidence.'
      )
      return text(
        '你把那个速度数字写在光速旁边，两个数字挨在一起，像在自我介绍。麦克斯韦 1865 年的论文或许已经包含了光的真正定义。',
        'You write the two numbers side by side and they seem to introduce themselves. Maxwell\'s 1865 paper may already contain the true definition of light.'
      )
    }
  },
  {
    id: 'measure_wave_speed',
    type: 'experiment',
    chapter: 8,
    label: text('我计算电磁波的速度，看看它是否等于光速。', 'I calculate the speed of electromagnetic waves and compare it with light speed.'),
    hint: text('需要 2 点精力。完成后得到 2 次预测，灵感 +1。', 'Spend 2 energy. You gain 2 predictions and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.fields,
    once: true,
    run(s) {
      s.predictions += 2
      s.insight += 1
      s.facts.lightSpeed = true
      return text(
        '你算出场的波动速度。那个数字太熟悉了，像一道光从纸背后照出来。',
        'You calculate the speed of waves in the fields. The number is too familiar, like light shining from behind the page.'
      )
    }
  },
  {
    id: 'law_maxwell',
    type: 'theory',
    chapter: 8,
    label: text('写下我的结论：光是传播中的电场和磁场。', 'I write my conclusion: light is a traveling electric and magnetic field.'),
    hint: text('需要 1 点精力。条件：理解场和光速，拥有 2 条记录、2 点灵感和 2 次预测。', 'Spend 1 energy. Needs fields, light speed, 2 notes, 2 insight, and 2 predictions'),
    cost: 1,
    visible: (s) => s.facts.lightSpeed,
    requires: (s) => s.facts.fields && s.facts.lightSpeed && s.records >= 2 && s.insight >= 2 && s.predictions >= 2,
    run(s) {
      s.records -= 2
      s.insight -= 2
      s.predictions -= 2
      s.laws.maxwell = true
      s.chapter = 9
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下麦克斯韦方程。电和磁互相追逐，自己向外传播；光，原来就是这种追逐的波。桌角的线圈忽然像一台机器。',
        'You write Maxwell’s equations. Changing electric and magnetic fields sustain one another and propagate outward; light is an electromagnetic wave. The coil on the table suddenly looks like a machine.'
      )
    }
  },
  {
    id: 'spin_motor',
    type: 'experiment',
    chapter: 9,
    label: text('我制作一个简单电动机，看看线圈会不会转动。', 'I build a simple motor and see whether the coil spins.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.motor = true
      return text(
        '通电线圈在磁场里转了半圈，又被换向器推着继续转。法拉第的小玩具露出电动机的骨架。',
        'A powered coil turns in a magnetic field, and a commutator pushes it onward. Faraday’s little toy reveals the skeleton of a motor.'
      )
    }
  },
  {
    id: 'wrong_power_free',
    type: 'misconception',
    chapter: 9,
    label: text('我猜：电动机是不是凭空产生了运动？', 'I guess: does the motor create motion from nothing?'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.motor && !s.facts.generator,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：电动机转得越用力，电池越快疲惫。机器不是凭空给力，而是在交换能量。',
        'Counterexample: the harder the motor works, the faster the battery tires. A machine does not make power from nothing; it trades energy.'
      )
      return text(
        '你差点把转动当成白来的礼物。电池发热的身体提醒你：账总要有人付。',
        'You almost treat rotation as a free gift. The warming battery reminds you that the bill is always paid somewhere.'
      )
    }
  },
  {
    id: 'turn_generator',
    type: 'experiment',
    chapter: 9,
    label: text('我反过来转动线圈，看看能不能发电。', 'I spin the coil the other way and see whether it generates electricity.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，预测 +1。', 'Spend 2 energy. You gain 2 notes. Prediction +1.'),
    cost: 2,
    requires: (s) => s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.generator = true
      return text(
        '你用手转动线圈，电流表醒了。电动机倒过来，竟像发电机；运动和电开始互相兑换。',
        'You turn the coil by hand, and the galvanometer wakes. Run backward, a motor becomes a generator; motion and electricity begin to trade places.'
      )
    }
  },
  {
    id: 'light_filament',
    type: 'experiment',
    chapter: 9,
    label: text('我接上灯泡，观察电能怎样变成光和热。', 'I connect a bulb and observe electricity becoming light and heat.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    requires: (s) => s.facts.generator,
    once: true,
    run(s) {
      s.records += 1
      s.facts.bulb = true
      return text(
        '细灯丝被电流烧得发白。斯旺和爱迪生都知道：要让城市亮起来，物理还得学会耐用。',
        'The thin filament glows white. Swan and Edison both know: to light a city, physics also has to learn durability.'
      )
    }
  },
  {
    id: 'law_electricPower',
    type: 'theory',
    chapter: 9,
    label: text('写下我的结论：发电、输电和用电可以组成一个系统。', 'I write my conclusion: generation, transmission, and use form a power system.'),
    hint: text('需要 1 点精力。条件：完成电机、发电机和灯泡实验，拥有 4 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs motor, generator, lamp, 4 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.bulb,
    requires: (s) => s.facts.motor && s.facts.generator && s.facts.bulb && s.records >= 4 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 4
      s.insight -= 1
      s.predictions -= 1
      s.laws.electricPower = true
      s.chapter = 10
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你把电动机、发电机和灯连成一条链：能量可以远距离分配，黑夜第一次显得可以被工程管理。',
        'You link motor, generator, and lamp into one chain: energy can be distributed across distance, and night begins to look like something engineering can manage.'
      )
    }
  },
  {
    id: 'spark_gap',
    type: 'experiment',
    chapter: 10,
    label: text('我制造火花，看看能不能产生电磁波。', 'I make a spark and see whether it creates electromagnetic waves.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    requires: (s) => s.laws.maxwell,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spark = true
      return text(
        '火花在间隙里啪地跳过。赫兹的装置很小，野心却很大：让麦克斯韦的波真的出现在桌上。',
        'A spark snaps across the gap. Hertz’s apparatus is small, but its ambition is large: make Maxwell’s waves appear on the table.'
      )
    }
  },
  {
    id: 'wrong_wire_needed',
    type: 'misconception',
    chapter: 10,
    label: text('我猜：信息必须沿着导线才能传到远处。', 'I guess: information must travel through wires.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.spark && !s.facts.antenna,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：麦克斯韦方程允许波离开导体。先让火花和天线说话，再决定消息能走多远。',
        'Counterexample: Maxwell’s equations allow waves to leave conductors. Let the spark and the antenna speak before deciding how far messages can go.'
      )
      return text(
        '你把消息困在铜线上。火花却像在敲墙，想把声音送到房间外。',
        'You trap the message in copper. The spark taps the wall, trying to send a voice outside the room.'
      )
    }
  },
  {
    id: 'build_antenna',
    type: 'experiment',
    chapter: 10,
    label: text('我架起天线，尝试接收远处的信号。', 'I raise an antenna and try to receive a distant signal.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，预测 +1。', 'Spend 2 energy. You gain 2 notes. Prediction +1.'),
    cost: 2,
    requires: (s) => s.facts.spark,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.antenna = true
      return text(
        '天线把火花的急促变化抛进空间。看不见的波从导线边缘松手，向外跑去。',
        'The antenna throws the spark’s rapid changes into space. Invisible waves let go of the wire edge and run outward.'
      )
    }
  },
  {
    id: 'tune_receiver',
    type: 'experiment',
    chapter: 10,
    label: text('我调节接收器，从许多信号中选出一个。', 'I tune the receiver and choose one signal from many.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，灵感 +1。', 'Spend 1 energy. You gain 1 note. Insight +1.'),
    cost: 1,
    requires: (s) => s.facts.antenna,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.radio = true
      return text(
        '接收器只在某个频率上醒来。马可尼的无线电不是魔法，而是让远方的节奏被这里认出。',
        'The receiver wakes only at one frequency. Marconi’s radio is not magic; it lets a far rhythm be recognized here.'
      )
    }
  },
  {
    id: 'law_radio',
    type: 'theory',
    chapter: 10,
    label: text('写下我的结论：信息可以通过电磁波无线传播。', 'I write my conclusion: information can travel wirelessly on electromagnetic waves.'),
    hint: text('需要 1 点精力。条件：完成天线和调谐实验，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs antenna, tuning, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.radio,
    requires: (s) => s.facts.antenna && s.facts.radio && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.radio = true
      s.chapter = 11
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下无线通信：把信息压进电磁波，再用调谐把它从空气里捞出来。暗室终于能听见远方。',
        'You establish wireless communication: encode information in electromagnetic waves, then recover it by tuning the receiver. The room can finally hear distant voices.'
      )
    }
  },
  {
    id: 'heat_water',
    type: 'experiment',
    chapter: 11,
    label: text('我烧水，观察蒸汽怎样推动壶盖。', 'I boil water and watch steam lift the lid.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，困惑 +1。', 'Spend 1 energy. You gain 1 note. Doubt +1.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.steam = true
      return text(
        '水汽顶起壶盖。热没有画箭头，却实实在在把东西推开了。',
        'Steam lifts the lid. Heat draws no arrow on the page, yet it pushes something open.'
      )
    }
  },
  {
    id: 'wrong_caloric',
    type: 'intuition',
    chapter: 11,
    label: text('我猜：热也许来自微观粒子的运动。', 'I guess: heat may come from the motion of tiny particles.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.steam && !s.facts.joule,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '你停下来想：热质说要求热量守恒，但摩擦能无限制地产生热。如果热是一种物质，它从哪里来？也许热根本不是物质，而是分子无序运动的总账单。',
        'You pause: caloric theory requires heat to be conserved, yet friction generates it endlessly. If heat is a substance, where does it come from? Perhaps heat is not matter at all — just the bill for chaotic molecular motion.'
      )
      return text(
        '你想起伦福德伯爵 1798 年镗炮筒的故事：持续摩擦产生了数倍于水当量的热，热质说无法解释这个数字。热，也许更像一种无序运动，而非一种流体。',
        'You recall Count Rumford\'s 1798 cannon-boring experiment: continuous friction produced far more heat than caloric theory could account for. Heat may be disordered motion, not a fluid.'
      )
    }
  },
  {
    id: 'turn_paddle',
    type: 'experiment',
    chapter: 11,
    label: text('我搅动水，看看机械功会不会变成热。', 'I stir water and see whether mechanical work becomes heat.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.steam,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.joule = true
      return text(
        '桨叶搅动水，温度慢慢升高。焦耳让机械功变成热，像把两本账合成一本。',
        'Paddles churn the water, and the temperature rises. Joule turns mechanical work into heat, merging two accounts into one.'
      )
    }
  },
  {
    id: 'build_heat_engine',
    type: 'experiment',
    chapter: 11,
    label: text('我观察蒸汽机，理解热怎样推动活塞。', 'I examine a steam engine and see how heat pushes a piston.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，预测 +1。', 'Spend 1 energy. You gain 1 note. Prediction +1.'),
    cost: 1,
    requires: (s) => s.facts.joule,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.engine = true
      return text(
        '热的蒸汽推动活塞，活塞带动飞轮。瓦特的机器把矿井、工厂和城市接进同一个节拍。',
        'Hot steam drives a piston, and the piston turns a flywheel. Watt’s engine pulls mines, factories, and cities into one rhythm.'
      )
    }
  },
  {
    id: 'law_energy',
    type: 'theory',
    chapter: 11,
    label: text('写下我的结论：能量不会消失，只会转化。', 'I write my conclusion: energy does not disappear; it only changes form.'),
    hint: text('需要 1 点精力。条件：理解功热转换和热机，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs work–heat conversion, engine, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.engine,
    requires: (s) => s.facts.joule && s.facts.engine && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.energy = true
      s.chapter = 12
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下能量守恒：功、热、电和运动可以换装，但总账不会凭空增减。',
        'You write down conservation of energy: work, heat, electricity, and motion can change costume, but the ledger never gains from nothing or loses into nothing. One account covers everything.'
      )
    }
  },
  {
    id: 'watch_waste_heat',
    type: 'experiment',
    chapter: 12,
    label: text('我观察热机排出的废热，思考为什么总有损失。', 'I observe waste heat from an engine and ask why some energy is always lost.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.laws.energy,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.wasteHeat = true
      return text(
        '热机做了功，也把大量热丢给冷端。能量没丢，可有些能量变得不再好用。',
        'The heat engine does work, yet dumps much heat to the cold side. Energy is not lost, but some of it becomes less useful.'
      )
    }
  },
  {
    id: 'wrong_perpetual_engine',
    type: 'misconception',
    chapter: 12,
    label: text('我猜：也许可以造出完全不浪费热量的机器。', 'I guess: maybe a perfect engine with no waste is possible.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.wasteHeat && !s.facts.carnotCycle,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：只看能量守恒还不够。热总要从热处流向冷处，循环会留下代价。',
        'Counterexample: conservation alone is not enough. Heat flows from hot to cold, and a cycle leaves a cost.'
      )
      return text(
        '你画出一台不浪费的热机。纸上很完美，现实里的冷端却不肯消失。',
        'You draw an engine with no waste. It is perfect on paper, but the cold side refuses to disappear.'
      )
    }
  },
  {
    id: 'trace_carnot_cycle',
    type: 'experiment',
    chapter: 12,
    label: text('我研究卡诺循环，寻找热机效率的上限。', 'I study the Carnot cycle to find the limit of engine efficiency.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，预测 +1。', 'Spend 2 energy. You gain 2 notes. Prediction +1.'),
    cost: 2,
    requires: (s) => s.facts.wasteHeat,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.carnotCycle = true
      return text(
        '卡诺循环把热机拆成四段。效率不再只是工匠手艺，而成了温度之间的命运。',
        'Carnot cycle splits the engine into four stages. Efficiency is no longer just craftsmanship; it is a fate written between temperatures.'
      )
    }
  },
  {
    id: 'count_microstates',
    type: 'experiment',
    chapter: 12,
    label: text('我观察分子的排列方式，理解熵为什么会增加。', 'I look at molecular arrangements to understand why entropy increases.'),
    hint: text('需要 1 点精力。完成后灵感 +1。', 'Spend 1 energy. Insight +1.'),
    cost: 1,
    requires: (s) => s.facts.carnotCycle,
    once: true,
    run(s) {
      s.insight += 1
      s.facts.entropyClue = true
      return text(
        '玻尔兹曼把分子当成一大群可能的排法。混乱不是没规律，而是可能性太多。',
        'Boltzmann treats molecules as a crowd of possible arrangements. Disorder is not lawlessness; it is too many possibilities.'
      )
    }
  },
  {
    id: 'law_entropy',
    type: 'theory',
    chapter: 12,
    label: text('写下我的结论：孤立系统的熵不会自发减少。', 'I write my conclusion: entropy in an isolated system does not decrease by itself.'),
    hint: text('需要 1 点精力。条件：理解循环和微观排列，拥有 3 条记录、2 点灵感和 1 次预测。', 'Spend 1 energy. Needs cycle, microstates, 3 notes, 2 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.entropyClue,
    requires: (s) => s.facts.carnotCycle && s.facts.entropyClue && s.records >= 3 && s.insight >= 2 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 1
      s.laws.entropy = true
      s.chapter = 13
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下熵：能量仍守恒，但可用性会散开。时间的箭头第一次在暗室里有了刻度。',
        'You discover entropy: energy is conserved, but usable energy tends to spread out. The arrow of time gains its first markings in the dark room.'
      )
    }
  },
  {
    id: 'strike_tuning_fork',
    type: 'experiment',
    chapter: 13,
    label: text('我敲响音叉，观察声音怎样传播。', 'I strike a tuning fork and observe how sound travels.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.vibration = true
      return text(
        '音叉在手里发颤，声音却钻进耳朵。你开始怀疑：空气也许在跟着颤。',
        'The tuning fork trembles in your hand, yet the sound reaches your ear. You begin to suspect that air trembles too.'
      )
    }
  },
  {
    id: 'wrong_sound_material',
    type: 'misconception',
    chapter: 13,
    label: text('我猜：声音是不是小粒子飞进耳朵？', 'I guess: is sound made of tiny particles flying into the ear?'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.vibration && !s.facts.airWave,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：声音穿过空气，却不是把一团物质丢到耳朵里。抽走空气后，它会消失。',
        'Counterexample: sound crosses air, but it does not throw a lump of matter into the ear. Remove the air, and it disappears.'
      )
      return text(
        '你把声音想成细小的东西飞出去。音叉还在抖，像是在提示“传递”的不是物质本身。',
        'You imagine sound as tiny bits of stuff flying away. The fork keeps trembling, hinting that what travels is not matter itself.'
      )
    }
  },
  {
    id: 'bell_jar',
    type: 'experiment',
    chapter: 13,
    label: text('我抽走空气，看看还能不能听到声音。', 'I remove the air and see whether sound can still be heard.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.vibration,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.airWave = true
      return text(
        '玻璃罩里的铃还在动，声音却越来越薄。空气不是旁观者，它是声音的路。',
        'The bell still moves inside the jar, but the sound thins away. Air is not a bystander; it is the road sound travels on.'
      )
    }
  },
  {
    id: 'map_resonance',
    type: 'experiment',
    chapter: 13,
    label: text('我做共振实验，看看声音是否有固定的形状。', 'I do a resonance experiment to see whether sound has a pattern.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，预测 +1。', 'Spend 1 energy. You gain 1 note. Prediction +1.'),
    cost: 1,
    requires: (s) => s.facts.airWave,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.resonance = true
      return text(
        '某个频率上，细沙跳出清楚的花纹。声音不是乱颤，而是有形状的波。',
        'At one frequency, sand jumps into a clear pattern. Sound is not random trembling; it is a shaped wave.'
      )
    }
  },
  {
    id: 'law_sound',
    type: 'theory',
    chapter: 13,
    label: text('写下我的结论：声音是介质中的机械波。', 'I write my conclusion: sound is a mechanical wave in a medium.'),
    hint: text('需要 1 点精力。条件：完成空气和共振实验，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs air, resonance, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.resonance,
    requires: (s) => s.facts.airWave && s.facts.resonance && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.sound = true
      s.chapter = 14
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下声波：介质来回振动，扰动向前传播。听见世界，原来是在读空气的波纹。',
        'You write down the sound wave: air swings back and forth while the shudder passes onward, neighbour to neighbour. To hear the world is to read the wrinkles passing through the air.'
      )
    }
  },
  {
    id: 'pass_prism',
    type: 'experiment',
    chapter: 14,
    label: text('我让白光穿过棱镜，看看它是否真的单纯。', 'I pass white light through a prism to see whether it is truly simple.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectrum = true
      return text(
        '白光被棱镜拆成彩色长带。牛顿把颜色从玻璃的魔术里救出来：颜色本来就在光里。',
        'White light splits into a colored band. Newton rescues color from the magic of glass: color was already in the light.'
      )
    }
  },
  {
    id: 'wrong_color_glass',
    type: 'misconception',
    chapter: 14,
    label: text('我猜：颜色是不是棱镜制造出来的？', 'I guess: does the prism create the colors?'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.spectrum && !s.facts.interference,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：再用第二个棱镜可以把颜色合回白光。玻璃改变路径，却不是凭空制造颜色。',
        'Counterexample: a second prism can recombine colors into white. Glass changes paths; it does not create color from nothing.'
      )
      return text(
        '你把彩色归功于棱镜。光谱却整齐得像一份被拆开的名单。',
        'You credit the prism for the colors. The spectrum looks too orderly, like a list that has been unfolded.'
      )
    }
  },
  {
    id: 'focus_lens',
    type: 'experiment',
    chapter: 14,
    label: text('我用透镜成像，观察光是否会弯曲。', 'I use a lens and observe whether light bends.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，预测 +1。', 'Spend 1 energy. You gain 1 note. Prediction +1.'),
    cost: 1,
    requires: (s) => s.facts.spectrum,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.lens = true
      return text(
        '透镜把远处的烛火压到纸上。望远镜和显微镜从同一种折射里长出来。',
        'A lens forms an image of a distant candle on paper. The telescope and the microscope grow out of the same refraction.'
      )
    }
  },
  {
    id: 'make_interference',
    type: 'experiment',
    chapter: 14,
    label: text('我做双缝实验，看看光能不能像水波一样叠加。', 'I try the double-slit experiment and see whether light overlaps like water waves.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.lens,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.interference = true
      return text(
        '两条缝在墙上织出明暗条纹。杨氏实验让光像波一样相加、相减。',
        'Two slits weave bright and dark bands on the wall. Young’s experiment shows light adding and canceling like waves.'
      )
    }
  },
  {
    id: 'law_optics',
    type: 'theory',
    chapter: 14,
    label: text('写下我的结论：光表现得像波。', 'I write my conclusion: light behaves like a wave.'),
    hint: text('需要 1 点精力。条件：完成光谱、透镜和干涉实验，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs spectrum, lens, interference, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.interference,
    requires: (s) => s.facts.spectrum && s.facts.lens && s.facts.interference && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.optics = true
      s.chapter = 15
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下波动光学：光会折射、成像、分色，也会干涉。它的路不是一条线，而是一整片波前。',
        'You establish wave optics: light refracts, forms images, disperses into colors, and interferes. Its behavior is not just a ray path, but a whole wavefront.'
      )
    }
  },
  {
    id: 'chase_light',
    type: 'experiment',
    chapter: 15,
    label: text('我想象自己追着一束光跑。', 'I imagine chasing a beam of light.'),
    hint: text('需要 1 点精力。这个选择会增加困惑。这个念头会打开一扇新门。', 'Spend 1 energy. This question opens a new door.'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.lightPuzzle = true
      return text(
        '你想象自己追上一束光。若真追上了，麦克斯韦的波会冻住吗？这个念头像一根刺。',
        'You imagine catching a beam of light. If you could, would Maxwell’s wave freeze? The thought is a splinter.'
      )
    }
  },
  {
    id: 'wrong_ether',
    type: 'intuition',
    chapter: 15,
    label: text('我猜：光也许不需要介质也能传播。', 'I guess: perhaps light can travel without a medium.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.lightPuzzle && !s.facts.michelsonMorley,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '如果光速不变，以太就失去了意义——以太存在的全部理由，就是给光提供一个参照物。而麦克斯韦的方程根本不需要参照物。也许真空本身就是光传播的场所。',
        'If light speed is constant, ether loses its purpose — ether\'s entire reason for existing is to give light a reference frame. Yet Maxwell\'s equations need no such frame. Perhaps vacuum itself is the medium.'
      )
      return text(
        '你写下：声音需要介质，但声速会随介质运动而改变；如果光速恒定，光就不能依赖介质。迈克耳孙和莫雷 1887 年的零结果，是以太给出的最后答案——它不存在。',
        'You write: sound needs a medium and its speed shifts with the medium\'s motion; if light speed is constant, light cannot depend on any medium. Michelson and Morley\'s null result of 1887 was ether\'s final answer — it does not exist.'
      )
    }
  },
  {
    id: 'michelson_morley',
    type: 'experiment',
    chapter: 15,
    label: text('我用迈克耳孙-莫雷实验寻找以太风。', 'I use the Michelson-Morley experiment to look for ether wind.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.lightPuzzle,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.michelsonMorley = true
      return text(
        '迈克耳孙和莫雷转动仪器，条纹几乎不动。以太风没有吹来，反而吹倒了旧直觉。',
        'Michelson and Morley rotate the apparatus, and the fringes barely move. No ether wind arrives; instead, an old intuition is blown over.'
      )
    }
  },
  {
    id: 'sync_clocks',
    type: 'experiment',
    chapter: 15,
    label: text('我重新思考：远处发生的“现在”是否绝对。', 'I rethink whether “now” is the same for distant places.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，预测 +1。', 'Spend 2 energy. You gain 2 notes. Prediction +1.'),
    cost: 2,
    requires: (s) => s.facts.michelsonMorley,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.clocks = true
      return text(
        '你用光信号校准远处时钟，发现“同时”不是宇宙免费赠送的标签，而是一种约定。',
        'You synchronize distant clocks with light signals and find that simultaneity is not a free label from the universe, but a convention.'
      )
    }
  },
  {
    id: 'law_specialRelativity',
    type: 'theory',
    chapter: 15,
    label: text('写下我的结论：光速不变，时间和空间会随观察者改变。', 'I write my conclusion: light speed is constant, while time and space depend on the observer.'),
    hint: text('需要 1 点精力。条件：理解没有以太风和同时性的相对性，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs no ether wind, simultaneity, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.clocks,
    requires: (s) => s.facts.michelsonMorley && s.facts.clocks && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.specialRelativity = true
      s.chapter = 16
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下狭义相对论：光速不让步，空间和时间只好一起调整。爱因斯坦把“现在”变成一道需要测量的问题。',
        'You establish special relativity: the speed of light is invariant, so space and time must adjust together. Einstein turns "now" into something that depends on how it is measured.'
      )
    }
  },
  {
    id: 'falling_elevator',
    type: 'experiment',
    chapter: 16,
    label: text('我想象自己站在自由下落的电梯里。', 'I imagine standing inside a freely falling elevator.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.laws.specialRelativity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.elevator = true
      return text(
        '自由下落的电梯里，重力像暂时消失。爱因斯坦把这个想象实验攥得很紧。',
        'Inside a freely falling elevator, gravity seems to vanish for a moment. Einstein holds tightly to this thought experiment.'
      )
    }
  },
  {
    id: 'wrong_gravity_force_only',
    type: 'misconception',
    chapter: 16,
    label: text('我猜：引力也许只是普通的力，和时空无关。', 'I guess: gravity may be an ordinary force, unrelated to spacetime.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.elevator && !s.facts.curvedSpacetime,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：自由落体可以局部抹掉重力感。也许引力不只是力，而是路径本身变了。',
        'Counterexample: free fall can locally erase the feeling of gravity. Perhaps gravity is not merely a force; perhaps the paths themselves have changed.'
      )
      return text(
        '你把引力画成一只手。电梯里的失重感却悄悄把那只手擦淡了。',
        'You draw gravity as a hand. The weightlessness in the elevator quietly fades that hand.'
      )
    }
  },
  {
    id: 'predict_light_bending',
    type: 'experiment',
    chapter: 16,
    label: text('我预测：太阳会不会让经过的星光弯曲？', 'I predict whether the Sun can bend passing starlight.'),
    hint: text('需要 2 点精力。完成后记录 +1，预测 +2。', 'Spend 2 energy. Notes +1, predictions +2.'),
    cost: 2,
    requires: (s) => s.facts.elevator,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 2
      s.facts.curvedSpacetime = true
      return text(
        '如果时空会弯，光也该沿着弯路走。太阳边缘的星光成了给宇宙出的考题。',
        'If spacetime curves, light should follow the curve. Starlight beside the Sun becomes an exam question for the universe.'
      )
    }
  },
  {
    id: 'observe_eclipse',
    type: 'experiment',
    chapter: 16,
    label: text('我在日食时验证星光是否真的偏折。', 'I check during an eclipse whether starlight is really bent.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，灵感 +1。', 'Spend 1 energy. You gain 1 note. Insight +1.'),
    cost: 1,
    requires: (s) => s.facts.curvedSpacetime,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.eclipse = true
      return text(
        '日食时，星光位置偏了一点。爱丁顿的照片让时空弯曲第一次有了公众证词。',
        'During the eclipse, starlight shifts slightly. Eddington’s photographs give curved spacetime its first public witness.'
      )
    }
  },
  {
    id: 'law_generalRelativity',
    type: 'theory',
    chapter: 16,
    label: text('写下我的结论：质量会弯曲时空，引力就是这种弯曲。', 'I write my conclusion: mass curves spacetime, and gravity is this curvature.'),
    hint: text('需要 1 点精力。条件：完成电梯思想实验和星光偏折观测，拥有 3 条记录、2 点灵感和 2 次预测。', 'Spend 1 energy. Needs falling elevator, light bending, 3 notes, 2 insight, and 2 predictions'),
    cost: 1,
    visible: (s) => s.facts.eclipse,
    requires: (s) => s.facts.elevator && s.facts.eclipse && s.records >= 3 && s.insight >= 2 && s.predictions >= 2,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 2
      s.laws.generalRelativity = true
      s.chapter = 17
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下广义相对论：物质告诉时空怎样弯曲，时空告诉物质怎样运动。引力变成了几何。',
        'You establish general relativity: matter tells spacetime how to curve, and spacetime tells matter how to move. Gravity becomes geometry.'
      )
    }
  },
  {
    id: 'cathode_ray',
    type: 'experiment',
    chapter: 17,
    label: text('我偏转阴极射线，寻找原子内部的线索。', 'I deflect cathode rays to look for clues inside the atom.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.electron = true
      return text(
        '阴极射线被电场和磁场偏转。汤姆孙看见了电子：原子不再是最小的硬球。',
        'Cathode rays bend in electric and magnetic fields. Thomson sees the electron: the atom is no longer the smallest hard sphere.'
      )
    }
  },
  {
    id: 'wrong_solid_atom',
    type: 'intuition',
    chapter: 17,
    label: text('我猜：原子里面也许还有更小的结构。', 'I guess: atoms may have smaller structures inside.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.electron && !s.facts.nucleus,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '电子已经从原子里跑出来了——那原子内部剩下什么？质量和正电荷去哪里了？如果那里是实心的，α 粒子不该被弹回来。',
        'The electron has already escaped the atom — so what remains inside? Where did the mass and positive charge go? If it were solid, alpha particles should not bounce back.'
      )
      return text(
        '你想到：一个原子的质量大部分集中在哪里？电子很轻，剩下的质量应该有个「家」。卢瑟福 1909 年让助手把 α 粒子打进金箔，准备验证汤姆孙的「葡萄干布丁」模型——结果却把它彻底推翻了。',
        'You wonder: where is most of an atom\'s mass? Electrons are light; the remaining mass must have a home. Rutherford in 1909 had his assistant fire alpha particles at gold foil to test Thomson\'s plum-pudding model — and ended up demolishing it completely.'
      )
    }
  },
  {
    id: 'gold_foil',
    type: 'experiment',
    chapter: 17,
    label: text('我用 α 粒子轰击金箔，探测原子内部。', 'I fire alpha particles at gold foil to probe the atom.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.electron,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.nucleus = true
      return text(
        '大多数粒子穿过去，少数却猛地弹回。卢瑟福像发现炮弹被薄纸反弹：原子中心有个很小很重的核。',
        'Most particles pass through, but a few rebound sharply. Rutherford sees cannonballs bounce from tissue paper: a tiny heavy nucleus sits at the center of the atom.'
      )
    }
  },
  {
    id: 'oil_drop',
    type: 'experiment',
    chapter: 17,
    label: text('我测量油滴电荷，看看电荷是否一份一份存在。', 'I measure oil-drop charges to see whether charge comes in pieces.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，预测 +1。', 'Spend 1 energy. You gain 1 note. Prediction +1.'),
    cost: 1,
    requires: (s) => s.facts.nucleus,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.chargeQuantized = true
      return text(
        '密立根让油滴悬停，电荷总是一份一份出现。电不只是连续的雾，也有颗粒感。',
        'Millikan holds oil drops suspended, and charge appears in repeated units. Electricity is not merely a continuous mist; it has a grain to it.'
      )
    }
  },
  {
    id: 'law_atom',
    type: 'theory',
    chapter: 17,
    label: text('写下我的结论：原子有原子核和电子，电荷有最小单位。', 'I write my conclusion: atoms have nuclei and electrons, and charge has a smallest unit.'),
    hint: text('需要 1 点精力。条件：理解电子、原子核和电荷量子化，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs electron, nucleus, quantized charge, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.chargeQuantized,
    requires: (s) => s.facts.electron && s.facts.nucleus && s.facts.chargeQuantized && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.atom = true
      s.chapter = 18
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下原子结构：电子在外，原子核在内，电荷有最小单位。物质第一次被拆出内部地形。',
        'You write down the atom: a tiny, heavy nucleus at the center; electrons occupying the space around it; and charge that arrives only in whole packets. For the first time, matter has an interior map.'
      )
    }
  },
  {
    id: 'blackbody',
    type: 'experiment',
    chapter: 18,
    label: text('我记录黑体辐射，寻找能量分布的规律。', 'I record blackbody radiation and look for its energy pattern.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.blackbody = true
      return text(
        '黑体炉口的颜色随温度改变，经典公式却在高频处崩坏。普朗克被迫把能量分成小份。',
        'The blackbody furnace changes color with temperature, while classical formulas fail at high frequency. Planck is forced to divide energy into packets.'
      )
    }
  },
  {
    id: 'wrong_continuous_energy',
    type: 'misconception',
    chapter: 18,
    label: text('我猜：能量也许像水流一样连续。', 'I guess: energy may flow continuously like water.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.blackbody && !s.facts.photoelectric,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：黑体辐射和光电效应都在逼你承认，光和能量有时像一份一份交付。',
        'Counterexample: blackbody radiation and the photoelectric effect both push you to admit that light and energy sometimes arrive in packets.'
      )
      return text(
        '你把能量画成光滑斜坡。炉口的颜色却像一排台阶，不肯变得平滑。',
        'You draw energy as a smooth slope. The blackbody data refuses to fit that smooth picture.'
      )
    }
  },
  {
    id: 'photoelectric',
    type: 'experiment',
    chapter: 18,
    label: text('我观察光电效应，思考光为什么能打出电子。', 'I observe the photoelectric effect and ask why light can knock out electrons.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，预测 +1。', 'Spend 2 energy. You gain 2 notes. Prediction +1.'),
    cost: 2,
    requires: (s) => s.facts.blackbody,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.photoelectric = true
      return text(
        '低频强光推不出电子，高频弱光却可以。爱因斯坦把光当成一粒粒能量包，门忽然开了。',
        'Bright low-frequency light cannot eject electrons, while weak high-frequency light can. Einstein treats light as packets of energy, and the explanation opens.'
      )
    }
  },
  {
    id: 'bohr_model',
    type: 'experiment',
    chapter: 18,
    label: text('我用玻尔模型解释氢原子的光谱。', 'I use the Bohr model to explain hydrogen’s spectrum.'),
    hint: text('需要 2 点精力。条件：先观察光电效应。完成后得到 1 条记录，灵感 +1。', 'Spend 2 energy. Needs: photoelectric effect. You gain 1 note and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.blackbody && s.facts.photoelectric,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.bohrModel = true
      return text(
        '玻尔把普朗克的量子条件嫁接到原子上：电子只能待在特定能级，跃迁时释放或吸收整份光子。氢原子的谱线第一次有了精确的数字预测。',
        'Bohr grafts Planck\'s quantum condition onto the atom: electrons inhabit only certain energy levels, emitting or absorbing whole photons when they jump. The spectral lines of hydrogen receive their first precise numerical prediction.'
      )
    }
  },
  {
    id: 'law_quanta',
    type: 'theory',
    chapter: 18,
    label: text('写下我的结论：光的能量是一份一份的，E = hν。', 'I write my conclusion: light energy comes in packets, E = hν.'),
    hint: text('需要 1 点精力。条件：理解黑体辐射、光电效应和玻尔模型，拥有 3 条记录、1 点灵感和 1 次预测。', 'Spend 1 energy. Needs blackbody radiation, photoelectric effect, Bohr model, 3 notes, 1 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.photoelectric,
    requires: (s) => s.facts.blackbody && s.facts.photoelectric && s.facts.bohrModel && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.quanta = true
      s.chapter = 19
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下光量子：光既能像波传播，也能像粒子交换能量。经典图像第一次裂出真正的缝。',
        'You discover light quanta: light can propagate like a wave while exchanging energy in particle-like packets. The classical picture cracks for real.'
      )
    }
  },
  {
    id: 'spectral_lines',
    type: 'experiment',
    chapter: 19,
    label: text('我观察原子光谱，思考为什么颜色是固定的。', 'I observe atomic spectra and ask why only certain colors appear.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectralLines = true
      return text(
        '氢原子的光不是连续彩虹，而是一条条固定谱线。原子像只会唱几个音的乐器。',
        'Hydrogen light is not a continuous rainbow, but fixed spectral lines. The atom sounds like an instrument with only certain notes.'
      )
    }
  },
  {
    id: 'wrong_planet_electron',
    type: 'intuition',
    chapter: 19,
    label: text('我猜：电子的运动方式也许和普通物体完全不同。', 'I guess: electrons may move in a completely different way.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.spectralLines && !s.facts.matterWave,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '按经典电磁理论，做加速运动的电荷会持续辐射电磁波、损失能量，然后螺旋坠入原子核。这个过程只需不到一微秒。但原子在宇宙中稳定存在了数十亿年——经典图像根本上是错的。',
        'According to classical electromagnetism, an accelerating charge radiates continuously, losing energy, and spirals into the nucleus in under a microsecond. Yet atoms have been stable for billions of years — the classical picture is fundamentally wrong.'
      )
      return text(
        '你想：也许电子根本没有在"运动"——至少不是行星那种轨道运动。德布罗意 1924 年提出：电子有波长，稳定的轨道就是波恰好绕一圈的位置。这不是运动，这是驻波。',
        'You think: perhaps electrons are not "moving" at all — at least not in planetary orbits. De Broglie proposed in 1924 that electrons have wavelengths, and stable orbits are where the wave fits exactly around once. This is not motion; it is a standing wave.'
      )
    }
  },
  {
    id: 'matter_wave',
    type: 'experiment',
    chapter: 19,
    label: text('我思考德布罗意的想法：电子会不会也有波长？', 'I consider de Broglie’s idea: could electrons also have wavelengths?'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。 预测 +1。', 'Spend 2 energy. You gain 2 notes. Insight +1. Prediction +1.'),
    cost: 2,
    requires: (s) => s.facts.spectralLines,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.predictions += 1
      s.facts.matterWave = true
      return text(
        '德布罗意把波长交给电子。轨道不再是任意圆圈，而像只能容纳整圈波纹的弦。',
        'de Broglie assigns a wavelength to the electron. Allowed orbits stop being arbitrary circles and become standing-wave conditions.'
      )
    }
  },
  {
    id: 'uncertainty',
    type: 'experiment',
    chapter: 19,
    label: text('我测试：位置和动量能不能同时精确知道。', 'I test whether position and momentum can both be known exactly.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录，灵感 +1。', 'Spend 1 energy. You gain 1 note. Insight +1.'),
    cost: 1,
    requires: (s) => s.facts.matterWave,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.uncertainty = true
      return text(
        '你越想钉死位置，动量越散开。海森堡不是说仪器太差，而是世界不给这两张精确收据。',
        'The more tightly you pin position, the more momentum spreads. Heisenberg is not blaming bad instruments; the world does not issue both exact receipts at once.'
      )
    }
  },
  {
    id: 'law_quantum',
    type: 'theory',
    chapter: 19,
    label: text('写下我的结论：微观粒子只能用概率来描述。', 'I write my conclusion: microscopic particles are described by probability.'),
    hint: text('需要 1 点精力。条件：理解物质波和不确定性，拥有 3 条记录、2 点灵感和 1 次预测。', 'Spend 1 energy. Needs matter waves, uncertainty, 3 notes, 2 insight, and 1 prediction'),
    cost: 1,
    visible: (s) => s.facts.uncertainty,
    requires: (s) => s.facts.matterWave && s.facts.uncertainty && s.records >= 3 && s.insight >= 2 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 1
      s.laws.quantum = true
      s.chapter = 20
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下量子力学：薛定谔的波函数给出概率，海森堡的不确定性划出边界。原子世界不再像小机械表。',
        'You establish quantum mechanics: Schrödinger’s wave function gives probabilities, and Heisenberg’s uncertainty principle sets limits. The atomic world is no tiny clockwork mechanism.'
      )
    }
  },
  {
    id: 'cloud_chamber',
    type: 'experiment',
    chapter: 20,
    label: text('我观察云室里放射性粒子的轨迹。', 'I observe the tracks left by radioactive particles in a cloud chamber.'),
    hint: text('需要 1 点精力。完成后得到 1 条记录', 'Spend 1 energy. You gain 1 note.'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.radioactivity = true
      return text(
        '云室里细线突然生长又消失。贝克勒尔和居里夫人打开的门，通向原子核深处。',
        'Thin lines suddenly grow and vanish in the cloud chamber. The door opened by Becquerel and Marie Curie leads deep into the nucleus.'
      )
    }
  },
  {
    id: 'wrong_atom_immutable',
    type: 'misconception',
    chapter: 20,
    label: text('我猜：原子核也许是稳定不变的。', 'I guess: the nucleus may be stable and unchanging.'),
    hint: text('这是一个猜想。试试看，实验会告诉你方向。', 'This is a guess. Try it and let the experiment answer.'),
    cost: 1,
    requires: (s) => s.facts.radioactivity && !s.facts.fission,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：放射性已经说明原子核会自己改变。用中子敲铀核，看看裂缝会不会变大。',
        'Counterexample: radioactivity already shows that nuclei can change on their own. Strike uranium with neutrons and see whether the crack grows.'
      )
      return text(
        '你把原子核当成最后的硬石头。云室轨迹却像石头里冒出的细烟。',
        'You treat the nucleus as the final hard stone. Cloud-chamber tracks rise from it like thin smoke.'
      )
    }
  },
  {
    id: 'split_uranium',
    type: 'experiment',
    chapter: 20,
    label: text('我用中子轰击铀核，观察裂变释放的能量。', 'I fire neutrons at uranium nuclei and observe the energy released by fission.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，灵感 +1。', 'Spend 2 energy. You gain 2 notes and 1 insight.'),
    cost: 2,
    requires: (s) => s.facts.radioactivity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fission = true
      return text(
        '铀核裂成两块，并放出新的中子。哈恩看到结果，迈特纳给出解释：质量差变成了能量。',
        'Uranium splits into two pieces and releases new neutrons. Hahn sees the result, and Meitner explains it: missing mass becomes energy.'
      )
    }
  },
  {
    id: 'chain_reaction',
    type: 'experiment',
    chapter: 20,
    label: text('我计算链式反应，看看一个中子能引发多大变化。', 'I calculate a chain reaction and see how much one neutron can trigger.'),
    hint: text('需要 2 点精力。完成后得到 2 条记录，预测 +2。', 'Spend 2 energy. You gain 2 notes. Predictions +2.'),
    cost: 2,
    requires: (s) => s.facts.fission,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 2
      s.facts.chainReaction = true
      return text(
        '一个中子引出更多中子，数字开始像火一样蔓延。费米的反应堆和原子弹站在同一条岔路口。',
        'One neutron leads to more neutrons, and the numbers spread like fire. Fermi’s reactor and the atomic bomb stand at the same fork.'
      )
    }
  },
  {
    id: 'law_nuclearAge',
    type: 'theory',
    chapter: 20,
    label: text('写下最后的结论：核能既能发电，也能制造武器。物理走到了选择的路口。', 'I write the final conclusion: nuclear energy can power cities or destroy them. Physics has reached a crossroads.'),
    hint: text('需要 1 点精力。条件：理解裂变和链式反应，拥有 4 条记录、1 点灵感和 2 次预测。', 'Spend 1 energy. Needs fission, chain reaction, 4 notes, 1 insight, and 2 predictions'),
    cost: 1,
    visible: (s) => s.facts.chainReaction,
    requires: (s) => s.facts.fission && s.facts.chainReaction && s.records >= 4 && s.insight >= 1 && s.predictions >= 2,
    run(s) {
      s.records -= 4
      s.insight -= 1
      s.predictions -= 2
      s.laws.nuclearAge = true
      s.complete = true
      s.feedback = null
      return text(
        '你写下核时代：同一套物理能点亮城市，也能毁掉城市。暗室最后没有给出按钮，只把责任交回你手里。',
        'You enter the nuclear age: the same physics can light cities and destroy them. The dark room gives you no final button; it places responsibility back in your hands.'
      )
    }
  }
]

const LAW_LIST = [
  { key: 'inertia', name: text('第一定律', 'First Law of Motion'), task: text('惯性', 'Inertia'), chain: ['push_cart_rough', 'compare_surfaces', 'ramp_friction', 'law_inertia'] },
  { key: 'second', name: text('第二定律', 'Second Law of Motion'), task: text('F = ma', 'F = ma'), chain: ['push_cart', 'vary_force', 'add_mass', 'invent_calculus', 'law_second'] },
  { key: 'third', name: text('第三定律', 'Third Law of Motion'), task: text('相互作用', 'Interaction'), chain: ['collide_carts', 'pull_rope', 'measure_pair_force', 'law_third'] },
  { key: 'gravity', name: text('万有引力', 'Universal Gravitation'), task: text('地月同律', 'Earth and Moon'), chain: ['read_moon', 'estimate_curve', 'compare_earth_sky', 'law_gravity'] },
  { key: 'principia', name: text('《原理》', 'Principia'), task: text('经典力学', 'Classical mechanics'), chain: ['law_inertia', 'law_second', 'law_third', 'law_gravity', 'write_principia'] },
  { key: 'charge', name: text('电荷', 'Charge'), task: text('吸引与排斥', 'Attraction and repulsion'), chain: ['rub_amber', 'compare_charges', 'law_charge'] },
  { key: 'currentMagnetism', name: text('电流磁效应', 'Magnetic Effect of Current'), task: text('电生磁', 'Current produces magnetism'), chain: ['close_circuit', 'compass_near_wire', 'law_currentMagnetism'] },
  { key: 'induction', name: text('电磁感应', 'Electromagnetic Induction'), task: text('变化生电', 'Change produces current'), chain: ['move_magnet_coil', 'reverse_motion', 'law_induction'] },
  { key: 'maxwell', name: text('麦克斯韦方程', 'Maxwell\u2019s Equations'), task: text('光是电磁波', 'Light is an EM wave'), chain: ['draw_fields', 'measure_wave_speed', 'law_maxwell'] },
  { key: 'electricPower', name: text('电力系统', 'Electric Power'), task: text('电机与灯', 'Motors and lamps'), chain: ['spin_motor', 'turn_generator', 'light_filament', 'law_electricPower'] },
  { key: 'radio', name: text('无线电', 'Radio'), task: text('远距离通信', 'Long-distance signals'), chain: ['spark_gap', 'build_antenna', 'tune_receiver', 'law_radio'] },
  { key: 'energy', name: text('能量守恒', 'Conservation of Energy'), task: text('功热互换', 'Work and heat'), chain: ['heat_water', 'turn_paddle', 'build_heat_engine', 'law_energy'] },
  { key: 'entropy', name: text('熵增方向', 'Entropy'), task: text('时间箭头', 'Arrow of time'), chain: ['watch_waste_heat', 'trace_carnot_cycle', 'count_microstates', 'law_entropy'] },
  { key: 'sound', name: text('声波', 'Sound Waves'), task: text('空气振动', 'Air vibration'), chain: ['strike_tuning_fork', 'bell_jar', 'map_resonance', 'law_sound'] },
  { key: 'optics', name: text('波动光学', 'Wave Optics'), task: text('干涉成像', 'Interference and imaging'), chain: ['pass_prism', 'focus_lens', 'make_interference', 'law_optics'] },
  { key: 'specialRelativity', name: text('狭义相对论', 'Special Relativity'), task: text('光速不变', 'Invariant light speed'), chain: ['chase_light', 'michelson_morley', 'sync_clocks', 'law_specialRelativity'] },
  { key: 'generalRelativity', name: text('广义相对论', 'General Relativity'), task: text('弯曲时空', 'Curved spacetime'), chain: ['falling_elevator', 'predict_light_bending', 'observe_eclipse', 'law_generalRelativity'] },
  { key: 'atom', name: text('原子结构', 'Atomic Structure'), task: text('电子与原子核', 'Electron and nucleus'), chain: ['cathode_ray', 'gold_foil', 'oil_drop', 'law_atom'] },
  { key: 'quanta', name: text('光量子', 'Light Quanta'), task: text('能量分份', 'Discrete energy packets'), chain: ['blackbody', 'photoelectric', 'bohr_model', 'law_quanta'] },
  { key: 'quantum', name: text('量子力学', 'Quantum Mechanics'), task: text('概率与不确定性', 'Probability and uncertainty'), chain: ['spectral_lines', 'matter_wave', 'uncertainty', 'law_quantum'] },
  { key: 'nuclearAge', name: text('核时代', 'Nuclear Age'), task: text('裂变与责任', 'Fission and responsibility'), chain: ['cloud_chamber', 'split_uranium', 'chain_reaction', 'law_nuclearAge'] }
]

const FACT_CONCEPTS = [
  { key: 'calculus', name: text('微积分', 'Calculus'), task: text('计算瞬时变化', 'Instant change'), chain: ['invent_calculus'] },
  { key: 'fields', name: text('场', 'Field'), task: text('空间有结构', 'Structured space'), chain: ['draw_fields'] },
  { key: 'motor', name: text('电动机', 'Motor'), task: text('电转成运动', 'Electricity to motion'), chain: ['spin_motor'] },
  { key: 'bulb', name: text('灯泡', 'Lamp'), task: text('电转成光', 'Electricity to light'), chain: ['light_filament'] },
  { key: 'engine', name: text('热机', 'Heat Engine'), task: text('热推动机器', 'Heat drives machines'), chain: ['build_heat_engine'] },
  { key: 'resonance', name: text('共振', 'Resonance'), task: text('频率选择', 'Frequency selection'), chain: ['map_resonance'] },
  { key: 'spectrum', name: text('光谱', 'Spectrum'), task: text('颜色在光中', 'Colors in light'), chain: ['pass_prism'] },
  { key: 'curvedSpacetime', name: text('时空弯曲', 'Curved Spacetime'), task: text('光路偏折', 'Bent light paths'), chain: ['predict_light_bending'] },
  { key: 'electron', name: text('电子', 'Electron'), task: text('原子可分', 'Atoms have parts'), chain: ['cathode_ray'] },
  { key: 'nucleus', name: text('原子核', 'Nucleus'), task: text('小而重的中心', 'Small heavy center'), chain: ['gold_foil'] },
  { key: 'matterWave', name: text('物质波', 'Matter Wave'), task: text('电子也有波', 'Electrons have wave behavior'), chain: ['matter_wave'] },
  { key: 'fission', name: text('裂变', 'Fission'), task: text('质量变能量', 'Mass-energy conversion'), chain: ['split_uranium'] }
]

const CHAPTER_FACT_KEYS = [
  ['push_cart_rough', 'compare_surfaces', 'ramp_friction', 'extrapolate_no_friction', 'wrong_needs_force', 'stopped', 'smoothSlides', 'rampIdeal'],
  ['push_cart', 'vary_force', 'add_mass', 'invent_calculus', 'push', 'forceChange', 'mass', 'calculus'],
  ['collide_carts', 'pull_rope', 'measure_pair_force', 'collision', 'rope', 'equalPair'],
  ['read_moon', 'estimate_curve', 'compare_earth_sky', 'moon', 'curve', 'sameGravity'],
  [],
  ['rub_amber', 'compare_charges', 'amber', 'chargePair'],
  ['close_circuit', 'compass_near_wire', 'current', 'oersted'],
  ['move_magnet_coil', 'reverse_motion', 'induction', 'changeMatters'],
  ['draw_fields', 'measure_wave_speed', 'fields', 'lightSpeed'],
  ['spin_motor', 'turn_generator', 'light_filament', 'motor', 'generator', 'bulb'],
  ['spark_gap', 'build_antenna', 'tune_receiver', 'spark', 'antenna', 'radio'],
  ['heat_water', 'turn_paddle', 'build_heat_engine', 'steam', 'joule', 'engine'],
  ['watch_waste_heat', 'trace_carnot_cycle', 'count_microstates', 'wasteHeat', 'carnotCycle', 'entropyClue'],
  ['strike_tuning_fork', 'bell_jar', 'map_resonance', 'vibration', 'airWave', 'resonance'],
  ['pass_prism', 'focus_lens', 'make_interference', 'spectrum', 'lens', 'interference'],
  ['chase_light', 'michelson_morley', 'sync_clocks', 'lightPuzzle', 'michelsonMorley', 'clocks'],
  ['falling_elevator', 'predict_light_bending', 'observe_eclipse', 'elevator', 'curvedSpacetime', 'eclipse'],
  ['cathode_ray', 'gold_foil', 'oil_drop', 'electron', 'nucleus', 'chargeQuantized'],
  ['blackbody', 'photoelectric', 'bohr_model', 'blackbody', 'photoelectric', 'bohrModel'],
  ['spectral_lines', 'matter_wave', 'uncertainty', 'spectralLines', 'matterWave', 'uncertainty'],
  ['cloud_chamber', 'split_uranium', 'chain_reaction', 'radioactivity', 'fission', 'chainReaction']
]

const CHAPTER_LAW_KEYS = [
  ['inertia'],
  ['second'],
  ['third'],
  ['gravity'],
  ['principia'],
  ['charge'],
  ['currentMagnetism'],
  ['induction'],
  ['maxwell'],
  ['electricPower'],
  ['radio'],
  ['energy'],
  ['entropy'],
  ['sound'],
  ['optics'],
  ['specialRelativity'],
  ['generalRelativity'],
  ['atom'],
  ['quanta'],
  ['quantum'],
  ['nuclearAge']
]

function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}

function migrateSavedState(state) {
  if (state.complete && !state.laws.nuclearAge) {
    state.complete = false
    state.chapter = state.laws.maxwell ? 9 : Math.max(state.chapter || 0, 5)
    if (!state.laws.maxwell) state.laws.principia = true
    state.feedback = null
    state.logs = [
      {
        time: state.day || 1,
        text: text(
          '你翻开新的纸页。旧结局退后一步，电机、热机、光谱和原子核在暗处等着继续发问。',
          'You open a new page. The old ending steps aside, while motors, heat engines, spectra, and nuclei wait in the dark with new questions.'
        )
      },
      ...(state.logs || [])
    ]
  }
  return state
}

function clearProgressFromChapter(state, chapter) {
  for (let index = chapter; index < CHAPTERS.length; index += 1) {
    ;(CHAPTER_FACT_KEYS[index] || []).forEach((key) => {
      delete state.facts[key]
    })
    ;(CHAPTER_LAW_KEYS[index] || []).forEach((key) => {
      delete state.laws[key]
    })
  }
}

function findReadyTheory(state) {
  return ACTIONS.find((action) =>
    action.type === 'theory' &&
    action.chapter === state.chapter &&
    (!action.visible || action.visible(state)) &&
    canRun(state, action) &&
    state.energy >= THEORY_MIN_ENERGY &&
    state.doubt  <= THEORY_MAX_DOUBT
  )
}

// Requirements met but energy/doubt state not ready yet
function findPendingTheory(state) {
  return ACTIONS.find((action) =>
    action.type === 'theory' &&
    action.chapter === state.chapter &&
    (!action.visible || action.visible(state)) &&
    canRun(state, action) &&
    (state.energy < THEORY_MIN_ENERGY || state.doubt > THEORY_MAX_DOUBT)
  )
}

// Content conditions met (records/facts/insight), regardless of energy/doubt
// Used by the analysis_final action to decide if the theory can be discovered
// Deliberately ignores energy so the "locked reason" shown to the player is accurate
function findContentReadyTheory(state) {
  return ACTIONS.find((action) => {
    if (action.type !== 'theory') return false
    if (action.chapter !== state.chapter) return false
    if (action.once && state.facts[action.id]) return false
    if (action.visible && !action.visible(state)) return false
    return !action.requires || action.requires(state)
  })
}

// 检查action是否因灵感不足而无法执行
function isInsightBlocked(state, action) {
  if (action.type === 'theory') return false
  if (!action.requires) return false
  if (canRun(state, action)) return false
  // 临时提高灵感，若此时能执行，说明灵感不足是真正的原因
  const saved = state.insight
  state.insight = INSIGHT_REQUIRE + 1
  const result = canRun(state, action)
  state.insight = saved
  return result
}

function canRun(state, action) {
  if (state.complete) return false
  if (action.chapter !== state.chapter) return false
  if (action.once && state.facts[action.id]) return false
  if (state.energy <= 0) return false
  return !action.requires || action.requires(state)
}

function actionKind(action, lang) {
  if (action.type === 'theory') return pick(UI.kinds.theory, lang)
  if (action.type === 'experiment') return pick(UI.kinds.experiment, lang)
  if (action.type === 'misconception') return pick(UI.kinds.misconception, lang)
  if (action.type === 'intuition') return pick(UI.kinds.intuition, lang)
  return pick(UI.kinds.rest, lang)
}

const REST_OPTIONS = [
  { id: 'rest_orchard', text: text('在苹果树下静坐，看果子一颗颗落下', 'Sit under the apple tree, watching fruit fall'), effects: [
    { p: 0.4, desc: text('微风拂过，你感到精力充沛。', 'A breeze passes. You feel refreshed.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('一颗苹果砸在脚边。你忽然想到：为什么它总是直直往下落？', 'An apple drops beside your foot. You wonder: why does it always fall straight down?'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('你在树下睡着了，梦到月亮也在往下掉。醒来后精力恢复了不少。', 'You doze off and dream the Moon is falling too. You wake refreshed.'), energy: 8, insight: 0, doubt: 0 }
  ]},
  { id: 'rest_walk', text: text('在花园小径散步，观察花草的生长', 'Walk the garden path, observing plants grow'), effects: [
    { p: 0.5, desc: text('散步让思绪清晰起来。', 'The walk clears your mind.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('你注意到藤蔓总是绕着支架生长——一种看不见的规律在起作用。', 'You notice vines always spiral around their supports — an invisible rule at work.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('一只蝴蝶落在肩上。你忽然觉得，自然界的秩序比想象中更美。', 'A butterfly lands on your shoulder. Nature’s order is more beautiful than you imagined.'), energy: 7, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_tea', text: text('泡一壶茶，和路过的老友聊聊天', 'Brew tea and chat with an old friend'), effects: [
    { p: 0.4, desc: text('老友讲了一个关于磁石的故事，很有趣，但和你的研究无关。', 'Your friend tells a story about lodestones — interesting, but unrelated to your work.'), energy: 6, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('老友问你在研究什么。你试着解释，说着说着自己也有了新的想法。', 'Your friend asks about your research. Explaining it gives you a new idea.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('茶很香，朋友的笑话让你彻底放松下来。', 'The tea is fragrant, and your friend’s jokes let you fully relax.'), energy: 9, insight: 0, doubt: -1 }
  ]},
  { id: 'rest_stargaze', text: text('夜里登上屋顶，用望远镜看星星', 'Climb to the roof at night, gaze at stars through a telescope'), effects: [
    { p: 0.4, desc: text('星空很美，但今晚没有特别的发现。', 'The stars are beautiful, but tonight brings no special discovery.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('你注意到木星旁边有几颗小星排成一条线。伽利略也曾看过它们。', 'You notice small stars lined up beside Jupiter. Galileo saw them too.'), energy: 4, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('一颗流星划过。你许了个愿，然后想到：流星的轨迹也是物理。', 'A shooting star crosses the sky. You make a wish, then realize: its path is physics too.'), energy: 6, insight: 1, doubt: 0 }
  ]},
  { id: 'rest_music', text: text('拿起鲁特琴，弹一首伽利略父亲作的曲子', 'Pick up the lute, play a piece by Galileo’s father'), effects: [
    { p: 0.5, desc: text('音乐让心情平静下来。', 'The music calms your mind.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('弹到一半，你注意到琴弦的振动——声音和振动之间有什么关系？', 'Midway, you notice the string’s vibration — what is the link between sound and vibration?'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.2, desc: text('你即兴弹了一段从未听过的旋律。创造力似乎被唤醒了。', 'You improvise a melody you have never heard. Creativity seems awakened.'), energy: 7, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_sketch', text: text('拿出炭笔，画下桌上的实验装置', 'Take out charcoal and sketch the apparatus'), effects: [
    { p: 0.4, desc: text('画得很仔细，但只是重复了已知的东西。', 'You draw carefully, but only reproduce what you already know.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.4, desc: text('画着画着，你发现之前忽略了一个细节——装置的角度可能很重要。', 'While drawing, you notice a detail you missed — the angle of the apparatus might matter.'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('画完后你退后一步看，整张图忽然有了新的意义。', 'Stepping back, the whole drawing suddenly takes on new meaning.'), energy: 5, insight: 2, doubt: -1 }
  ]},
  { id: 'rest_read', text: text('翻阅前人的记录和信件', 'Read through old manuscripts and letters'), effects: [
    { p: 0.4, desc: text('记录很厚，但大部分内容你已经知道了。', 'The manuscripts are thick, but you already know most of it.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('在一封旧信里，你发现了一个被遗忘的实验灵感。', 'In an old letter, you find a forgotten experimental approach.'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('前人的困惑和你的困惑如此相似。你不再觉得孤单。', 'Their confusion mirrors yours. You no longer feel alone.'), energy: 6, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_experiment', text: text('做一些无关的小实验，纯粹为了好玩', 'Do some unrelated small experiments, just for fun'), effects: [
    { p: 0.3, desc: text('小实验失败了，但你笑得很开心。', 'The small experiment fails, but you laugh heartily.'), energy: 6, insight: 0, doubt: 0 },
    { p: 0.4, desc: text('一个意外的现象引起了你的注意——虽然和当前研究无关，但值得记下来。', 'An unexpected phenomenon catches your eye — unrelated but worth noting.'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('玩着玩着，你忽然想到了一种新的测量方法。', 'Playing around, you suddenly think of a new measurement method.'), energy: 4, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_nap', text: text('趴在桌上小睡一会儿', 'Nap at the desk for a while'), effects: [
    { p: 0.5, desc: text('睡了半小时，醒来精神好多了。', 'You sleep for half an hour and wake feeling much better.'), energy: 8, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('半梦半醒之间，一个模糊的想法飘过脑海。你赶紧记下来。', 'Between sleep and waking, a vague idea drifts through your mind. You quickly write it down.'), energy: 6, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('你做了一个奇怪的梦，梦里所有的物理定律都是反的。醒来后你觉得这很有意思。', 'You dream all physical laws are reversed. You wake up finding it intriguing.'), energy: 7, insight: 1, doubt: 1 }
  ]},
  { id: 'rest_organize', text: text('整理散乱的笔记和草稿', 'Organize scattered notes and drafts'), effects: [
    { p: 0.4, desc: text('桌面整洁了不少，但没发现什么新东西。', 'The desk is tidier, but nothing new emerges.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('整理时发现两张草稿纸上画着相似的东西——你之前怎么没注意到？', 'While organizing, you find two drafts with similar drawings — how did you miss this?'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('把笔记按时间排列后，灵感的演变清晰可见。你看到了自己的进步。', 'Arranging notes chronologically, the evolution of your thinking becomes clear. You see your own progress.'), energy: 6, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_water', text: text('去河边散步，往水里扔石子看涟漪', 'Walk by the river, skip stones and watch ripples'), effects: [
    { p: 0.4, desc: text('涟漪一圈圈散开，很放松。', 'Ripples spread in circles. Relaxing.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('你盯着涟漪看了很久。波从中心向外传播——光和声音是不是也这样？', 'You stare at the ripples. Waves spread from the center — do light and sound do the same?'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('两块石子同时落水，两圈涟漪交叉穿过。你看到了干涉。', 'Two stones hit the water together, their ripples crossing. You see interference.'), energy: 5, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_chess', text: text('和邻居下一盘国际象棋', 'Play a game of chess with a neighbor'), effects: [
    { p: 0.5, desc: text('棋局激烈，你暂时忘记了研究的事。', 'The game is intense, and you forget about research for a while.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('对手走了一步妙棋。你忽然想到：自然界是不是也在走一步妙棋？', 'Your opponent makes a brilliant move. You wonder: is nature also making brilliant moves?'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('你赢了。胜利的感觉让你信心倍增。', 'You win. The feeling of victory boosts your confidence.'), energy: 8, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_garden', text: text('在花园里给植物浇水，修剪枝叶', 'Water plants and trim branches in the garden'), effects: [
    { p: 0.5, desc: text('体力劳动让大脑得到了休息。', 'Physical labor gives your brain a rest.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('修剪枝叶时，你注意到植物的生长遵循某种数学规律。', 'While trimming, you notice plant growth follows a mathematical pattern.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('一株你从未注意过的花开了。新的事物总在最不经意的时候出现。', 'A flower you never noticed has bloomed. New things appear when least expected.'), energy: 6, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_candle', text: text('在烛光下写日记，记录今天的思考', 'Write in your journal by candlelight'), effects: [
    { p: 0.4, desc: text('写了很多，但都是已知的东西。', 'You write a lot, but it is all known.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('写着写着，一个模糊的想法变得清晰起来。', 'As you write, a vague idea becomes clear.'), energy: 4, insight: 1, doubt: -1 },
    { p: 0.3, desc: text('烛火在纸上投下跳动的影子。你盯着火焰看了很久——热和光，它们是什么关系？', 'The candle flame casts dancing shadows. You stare at the fire — heat and light, how are they related?'), energy: 5, insight: 1, doubt: 1 }
  ]},
  { id: 'rest_pet', text: text('逗弄实验室里养的小狗麦克斯', 'Play with Max, the lab dog'), effects: [
    { p: 0.5, desc: text('麦克斯摇着尾巴，你笑了。简单的快乐也是研究的一部分。', 'Max wags his tail, and you smile. Simple joy is part of research too.'), energy: 7, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('麦克斯追着自己的尾巴转圈。你忽然想到：圆周运动也需要力。', 'Max chases his own tail in circles. You realize: circular motion also requires force.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('麦克斯叼来一个球。你扔出去，它总能接住——动物对抛物线的直觉比人类还好。', 'Max fetches a ball. You throw it, and he always catches it — animals have better intuition for parabolas than humans.'), energy: 6, insight: 1, doubt: 0 }
  ]},
  { id: 'rest_bake', text: text('烤一个苹果派，让甜味充满房间', 'Bake an apple pie, filling the room with sweetness'), effects: [
    { p: 0.5, desc: text('苹果派出炉了，香气让整个暗室温暖起来。', 'The pie is done, its aroma warming the dark room.'), energy: 8, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('切派的时候你注意到：热从烤箱传到派上，派又慢慢冷却——热总是从热的地方流向冷的地方。', 'Cutting the pie, you notice: heat flows from oven to pie, and the pie slowly cools — heat always flows from hot to cold.'), energy: 6, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('太好吃了。你决定以后多做几次。灵感往往在满足的胃里发芽。', 'Delicious. You decide to do this more often. Inspiration often sprouts from a satisfied stomach.'), energy: 9, insight: 1, doubt: 0 }
  ]},
  { id: 'rest_meditate', text: text('闭目静思，让思绪自由漂浮', 'Close your eyes and let thoughts drift freely'), effects: [
    { p: 0.4, desc: text('静坐片刻，内心平静下来。', 'A moment of stillness, and your mind settles.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('在安静中，一个被忽略的问题浮出水面。', 'In the quiet, a neglected question surfaces.'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('你进入了很深的专注状态。睁开眼睛时，世界似乎变得更清晰了。', 'You enter a deep state of focus. When you open your eyes, the world seems sharper.'), energy: 7, insight: 2, doubt: -1 }
  ]},
  { id: 'rest_puzzle', text: text('玩一个机械拼图，锻炼手指和大脑', 'Play with a mechanical puzzle, exercising fingers and mind'), effects: [
    { p: 0.4, desc: text('拼图很难，但你乐在其中。', 'The puzzle is hard, but you enjoy it.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('解开拼图的那一刻，你忽然理解了：复杂的系统可能由简单的规则组成。', 'The moment the puzzle clicks, you understand: complex systems can arise from simple rules.'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('你发明了一种新的解法。创造力在玩耍时最活跃。', 'You invent a new solution. Creativity is most active during play.'), energy: 6, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_balcony', text: text('站在阳台上，看远处的山和云', 'Stand on the balcony, watching distant mountains and clouds'), effects: [
    { p: 0.5, desc: text('远眺让眼睛和大脑都得到了休息。', 'The distant view rests both your eyes and mind.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('云在移动，但它们的形状一直在变。你想到：有些东西在变，有些规律不变。', 'Clouds move, their shapes ever-changing. You think: some things change, but some rules stay constant.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('远处的闪电划过天空，几秒后雷声才到。光和声音的速度不一样。', 'Distant lightning flashes, thunder follows seconds later. Light and sound travel at different speeds.'), energy: 6, insight: 2, doubt: 1 }
  ]},
]
const THEORY_DEFS = {
  law_inertia: text('物体在不受外力时保持静止或匀速直线运动', 'An object remains at rest or in uniform motion unless acted upon by a force'),
  law_second: text('力等于质量乘以加速度 F=ma', 'Force equals mass times acceleration F=ma'),
  law_third: text('作用力与反作用力大小相等方向相反', 'Every action has an equal and opposite reaction'),
  law_gravity: text('任何两个物体之间都存在引力，与质量乘积成正比', 'Every mass attracts every other mass with a force proportional to their product'),
  write_principia: text('将力学三大定律和万有引力系统化为经典力学体系', 'Systematize the laws of motion and gravity into classical mechanics'),
  law_charge: text('自然界存在正负两种电荷，同斥异吸', 'Nature has positive and negative charges; like repels, unlike attracts'),
  law_currentMagnetism: text('电流通过导线时会在周围产生磁场', 'An electric current flowing through a wire creates a magnetic field around it'),
  law_induction: text('变化的磁场会在导体中产生感应电动势', 'A changing magnetic field induces an electromotive force in a conductor'),
  law_maxwell: text('电场和磁场相互激发，形成电磁波以光速传播', 'Electric and magnetic fields generate each other, forming electromagnetic waves traveling at light speed'),
  law_electricPower: text('利用电磁感应原理将机械能转化为电能', 'Convert mechanical energy into electrical energy using electromagnetic induction'),
  law_radio: text('利用电磁波在空间中传输信息', 'Use electromagnetic waves to transmit information through space'),
  law_energy: text('能量不会凭空产生或消失，只会从一种形式转化为另一种', 'Energy cannot be created or destroyed, only transformed from one form to another'),
  law_entropy: text('孤立系统的熵永不减少，自然过程有方向性', 'The entropy of an isolated system never decreases; natural processes have direction'),
  law_sound: text('声音是介质中传播的机械纵波', 'Sound is a mechanical longitudinal wave propagating through a medium'),
  law_optics: text('光是一种波，可解释折射、成像、分色和干涉', 'Light is a wave, explaining refraction, imaging, dispersion, and interference'),
  law_specialRelativity: text('物理定律在所有惯性系中相同，光速不变', 'The laws of physics are the same in all inertial frames; the speed of light is constant'),
  law_generalRelativity: text('引力是时空弯曲的表现，物质告诉时空如何弯曲', 'Gravity is the curvature of spacetime; matter tells spacetime how to curve'),
  law_atom: text('原子由原子核和绕核运动的电子组成', 'Atoms consist of a nucleus surrounded by orbiting electrons'),
  law_quanta: text('光以离散的能量包（光子）形式存在 E=hν', 'Light exists as discrete packets of energy (photons) E=hν'),
  law_quantum: text('微观粒子具有波粒二象性，由波函数描述', 'Microscopic particles exhibit wave-particle duality, described by wave functions'),
  law_nuclearAge: text('原子核可以裂变或聚变，释放巨大能量', 'Atomic nuclei can undergo fission or fusion, releasing enormous energy')
}

// Per-chapter analysis phase labels (2-step discovery sequence)
const CHAPTER_ANALYSIS = [
  // Ch0 — 惯性/摩擦力外推
  { mid:      text('比较不同摩擦程度下的运动距离', 'Compare sliding distances across surfaces of varying friction'),
    midKind:  text('比较', 'Compare'),
    midResult: text(
      '你把数据摆在一起：木板越光滑，小车滑得越远。把这条趋势推到极致——如果完全没有摩擦，小车根本没有理由停下来。',
      'The data lines up: smoother surface, longer slide. Push the trend to its limit — with zero friction, there is no reason for the cart to stop at all.'
    ),
    final:    text('将摩擦力外推为零，写下惯性定律', 'Extrapolate friction to zero and write the law of inertia'),
    finalKind: text('推导', 'Deduce') },
  // Ch1 — F = ma
  { mid:      text('计算砝码与小车的加速度关系', 'Calculate the acceleration-force relationship'),
    midKind:  text('计算', 'Calculate'),
    midResult: text(
      '砝码越多，加速度越大；小车越重，加速度越小。两件事可以写进同一个式子：力等于质量乘以加速度。',
      'More weight, more acceleration; heavier cart, less acceleration. Both facts fit one equation: force equals mass times acceleration.'
    ),
    final:    text('向导师展示你的力学推导', 'Present your force derivation to your mentor'),
    finalKind: text('汇报', 'Report') },
  // Ch2 — 作用力与反作用力
  { mid:      text('对比碰撞前后两辆小车的速度变化', 'Compare cart velocities before and after collision'),
    midKind:  text('对比', 'Compare'),
    midResult: text(
      '每一次碰撞，两辆小车的速度变化大小总是相等、方向总是相反。换一种碰撞方式，规律还在。力从来不是单向的。',
      'In every collision, both carts change speed by equal amounts in opposite directions. Change the collision — the pattern holds. Force is never one-sided.'
    ),
    final:    text('写下力总是成对出现的结论', 'Write your conclusion that forces always come in pairs'),
    finalKind: text('结论', 'Conclude') },
  // Ch3 — 万有引力
  { mid:      text('推导月球轨道是否符合落体引力规律', "Deduce whether the Moon's orbit follows the same gravitational law"),
    midKind:  text('推导', 'Deduce'),
    midResult: text(
      '月球绕地球运行的向心加速度，和地面落体的加速度，都符合同一个距离平方反比关系。苹果和月亮受的是同一种力。',
      "The Moon's centripetal acceleration and a falling apple's acceleration both follow the same inverse-square distance rule. Apple and Moon obey the same force."
    ),
    final:    text('写信向皇家学会汇报引力发现', 'Write to the Royal Society about your gravity findings'),
    finalKind: text('投稿', 'Submit') },
  // Ch4 — 经典力学体系
  { mid:      text('整理三大运动定律的数学形式', 'Organize the mathematical form of the three laws of motion'),
    midKind:  text('整理', 'Organize'),
    midResult: text(
      '三条运动定律和万有引力并排写在一起，每一条都有严格的数学形式。地上的碰撞和天上的轨道，终于说同一种语言。',
      'The three laws and gravity sit side by side, each in precise mathematical form. Collisions on Earth and orbits in the sky finally speak the same language.'
    ),
    final:    text('完成力学原理的草稿', 'Complete the draft of your mechanics principles'),
    finalKind: text('写稿', 'Draft') },
  // Ch5 — 电荷
  { mid:      text('分析各类物体的带电行为规律', 'Analyze the charging behavior of different materials'),
    midKind:  text('分析', 'Analyze'),
    midResult: text(
      '同种材料摩擦后相互排斥，异种材料相互吸引。换一批材料，规律不变。电性有两种，相互作用只由种类决定。',
      'Like materials repel after rubbing; unlike attract. Swap the materials — the rule holds. Electric character has two kinds, and their interaction depends only on which kinds meet.'
    ),
    final:    text('记录电荷的吸引与排斥规律', 'Record the rules of electric attraction and repulsion'),
    finalKind: text('记录', 'Record') },
  // Ch6 — 电流与磁
  { mid:      text('比较不同电流强度下磁针偏转的角度', 'Compare needle deflection at different current strengths'),
    midKind:  text('测量', 'Measure'),
    midResult: text(
      '电流越强，磁针偏转越大；断开电路，磁针立刻归零。偏转角度和电流之间有稳定的数量关系——电和磁是相连的。',
      'Stronger current, larger deflection. Cut the circuit, the needle returns to zero instantly. A stable numerical relation links current to deflection — electricity and magnetism are connected.'
    ),
    final:    text('向学会报告电流与磁的联系', 'Report to the Society on the link between current and magnetism'),
    finalKind: text('报告', 'Report') },
  // Ch7 — 电磁感应
  { mid:      text('推算感应电流与磁通量变化的关系', 'Derive the relationship between induction current and flux change'),
    midKind:  text('推算', 'Derive'),
    midResult: text(
      '磁铁移动越快，感应电流越强；停止运动，电流立刻消失。真正起作用的不是磁铁的存在，而是磁通量的变化速率。',
      'Faster magnet motion, stronger induced current; stop moving, current vanishes instantly. What matters is not the magnet itself, but the rate at which the magnetic flux changes.'
    ),
    final:    text('整理电磁感应的实验报告', 'Write up your electromagnetic induction report'),
    finalKind: text('报告', 'Report') },
  // Ch8 — 麦克斯韦方程
  { mid:      text('推导电场与磁场相互激发的对称方程', 'Derive the symmetric equations of mutually-generating fields'),
    midKind:  text('推导', 'Derive'),
    midResult: text(
      '变化的磁场产生电场，变化的电场产生磁场——两条方程形式完全对称。联立之后，可以推导出一种在真空中传播的波，速度恰好等于光速。',
      'A changing magnetic field generates an electric field; a changing electric field generates a magnetic field. The equations are perfectly symmetric. Combined, they predict a wave in vacuum whose speed equals the speed of light.'
    ),
    final:    text('写下电磁场方程组的草稿', 'Write a draft of your electromagnetic field equations'),
    finalKind: text('建模', 'Model') },
  // Ch9 — 电力系统
  { mid:      text('计算电机在不同条件下的转换效率', 'Calculate motor conversion efficiency under different conditions'),
    midKind:  text('计算', 'Calculate'),
    midResult: text(
      '不同负载下测得的效率数据遵循固定规律，损耗可以被量化。机械能和电能之间的转换是可以设计、可以优化的。',
      'Efficiency data at different loads follows clear rules, and losses can be quantified. The conversion between mechanical and electrical energy is designable and optimizable.'
    ),
    final:    text('绘制电力系统的原理图', 'Draw the schematic of an electric power system'),
    finalKind: text('设计', 'Design') },
  // Ch10 — 无线电
  { mid:      text('测量电磁波在空间中的传播特性', 'Measure electromagnetic wave propagation through space'),
    midKind:  text('测量', 'Measure'),
    midResult: text(
      '调整天线长度和发射频率，接收端信号强弱变化有规律可循。电磁波可以在空气中传播，距离和频率都能被测量和控制。',
      'Tuning antenna length and frequency, the received signal strength changes in a predictable pattern. Electromagnetic waves travel through air, and both distance and frequency are measurable and controllable.'
    ),
    final:    text('发出第一条有意义的无线电信号', 'Send the first meaningful radio signal'),
    finalKind: text('实测', 'Transmit') },
  // Ch11 — 能量守恒
  { mid:      text('计算各类转化过程中的能量总量', 'Calculate total energy across various transformation processes'),
    midKind:  text('计算', 'Calculate'),
    midResult: text(
      '热变功、功变电、电变热——无论经历几次转化，把所有数值加起来，总量始终不变。能量不会消失，只会换形式。',
      'Heat to work, work to electricity, electricity to heat — however many conversions, the total never changes. Energy does not disappear; it only changes form.'
    ),
    final:    text('写出能量守恒的普遍表达式', 'Write the general expression of energy conservation'),
    finalKind: text('总结', 'Summarize') },
  // Ch12 — 热力学/熵
  { mid:      text('分析热机的理想效率极限', 'Analyze the theoretical efficiency limit of a heat engine'),
    midKind:  text('分析', 'Analyze'),
    midResult: text(
      '卡诺循环的最大效率只取决于高温和低温的比值，与用什么工质无关。无论如何改进设计，热机都无法突破这个极限。',
      'The maximum efficiency of the Carnot cycle depends only on the ratio of the two temperatures, regardless of working substance. No engineering improvement can exceed this limit.'
    ),
    final:    text('写下关于热过程方向性的核心结论', 'Write the core conclusion on the directionality of thermal processes'),
    finalKind: text('结论', 'Conclude') },
  // Ch13 — 声学/机械波
  { mid:      text('测量声音在不同介质中的传播速度', 'Measure the speed of sound in different media'),
    midKind:  text('测量', 'Measure'),
    midResult: text(
      '声音在较密介质中传播更快，在真空中完全消失。振动频率决定音调，振幅决定响度。声音是机械振动在介质中向外扩散的过程。',
      'Sound travels faster in denser media and vanishes entirely in vacuum. Frequency determines pitch, amplitude determines volume. Sound is mechanical vibration propagating outward through a medium.'
    ),
    final:    text('整理机械波传播的普遍规律', 'Summarize the universal rules of mechanical wave propagation'),
    finalKind: text('整理', 'Summarize') },
  // Ch14 — 波动光学
  { mid:      text('分析双缝实验中明暗条纹的间距规律', 'Analyze fringe spacing patterns in the double-slit experiment'),
    midKind:  text('分析', 'Analyze'),
    midResult: text(
      '双缝实验的明暗条纹间距，与波长和缝距之间有精确的数学关系。这种叠加、抵消的图样，只有波才能产生。',
      'Fringe spacing in the double-slit experiment relates precisely to wavelength and slit separation. Only waves can produce this pattern of reinforcement and cancellation.'
    ),
    final:    text('写下光具有波动性的有力证据', 'Document compelling evidence for the wave nature of light'),
    finalKind: text('立论', 'Argue') },
  // Ch15 — 狭义相对论
  { mid:      text('推导光速不变引发的时间膨胀效应', 'Derive time dilation from the constancy of light speed'),
    midKind:  text('推导', 'Derive'),
    midResult: text(
      '如果光速对所有观测者都相同，运动中的时钟会走慢，运动中的尺子会缩短。时间和空间不再是两件独立的事——它们是同一种结构的两面。',
      'If light speed is the same for all observers, moving clocks run slow and moving rulers shrink. Time and space are no longer independent — they are two sides of one structure.'
    ),
    final:    text('写下狭义相对论的两条基本假设', 'Write down the two postulates of special relativity'),
    finalKind: text('立论', 'Postulate') },
  // Ch16 — 广义相对论
  { mid:      text('计算引力对光线弯曲的理论预测值', 'Calculate the predicted deflection of light by gravity'),
    midKind:  text('计算', 'Calculate'),
    midResult: text(
      '广义相对论预测的光线偏折角，是牛顿引力理论预测值的整整两倍。质量弯曲时空，光沿弯曲的路径传播——引力不是力，而是几何。',
      "General relativity predicts light deflection at exactly twice Newton's value. Mass curves spacetime; light follows the curved path — gravity is geometry, not a force."
    ),
    final:    text('提交广义相对论的数学框架', 'Submit the mathematical framework of general relativity'),
    finalKind: text('提交', 'Submit') },
  // Ch17 — 原子结构
  { mid:      text('分析氢原子光谱谱线的规律', 'Analyze the spectral line pattern of hydrogen'),
    midKind:  text('分析', 'Analyze'),
    midResult: text(
      '氢原子光谱的谱线间距，满足一个简单的整数平方倒数规律。这意味着电子只能停在特定的能级上，能量不是连续的。',
      'The spacing of hydrogen spectral lines follows a simple inverse-integer-square pattern. This means electrons can only occupy specific energy levels — energy is not continuous.'
    ),
    final:    text('描述原子的行星式结构模型', 'Describe the planetary model of atomic structure'),
    finalKind: text('建模', 'Model') },
  // Ch18 — 光量子/光电效应
  { mid:      text('计算光电效应中最大动能与频率的关系', 'Calculate the kinetic energy-frequency relationship in the photoelectric effect'),
    midKind:  text('计算', 'Calculate'),
    midResult: text(
      '光电效应的最大动能只和光的频率有关，与光的强弱无关。每个光子携带的能量 E = hν，普朗克常数 h 是自然界的基本单位。',
      'Maximum kinetic energy in the photoelectric effect depends only on frequency, not intensity. Each photon carries energy E = hν — Planck\'s constant h is a fundamental unit of nature.'
    ),
    final:    text('写下光量子假设的基本方程', 'Write the fundamental equation of the light quantum hypothesis'),
    finalKind: text('假设', 'Hypothesize') },
  // Ch19 — 量子力学/核能
  { mid:      text('推导核裂变链式反应的临界条件', 'Derive the critical conditions for a nuclear fission chain reaction'),
    midKind:  text('推导', 'Derive'),
    midResult: text(
      '链式反应能否持续，取决于铀的质量和几何形状。每次裂变释放的中子数量超过一，反应就能自我维持。能量的释放和失控，只差一步。',
      'Whether a chain reaction sustains depends on the mass and geometry of the uranium. Each fission releasing more than one neutron is self-sustaining. Power and catastrophe are one step apart.'
    ),
    final:    text('整理量子与核能时代的物理全景', 'Compile the complete physics panorama of the quantum-nuclear age'),
    finalKind: text('集大成', 'Synthesize') },
]

const THEORY_TOASTS = {
  law_inertia: text('暗室亮了一些：你发现了牛顿第一运动定律。', 'The room grows brighter: you have discovered Newton’s first law of motion.'),
  law_second: text('新的规律被点亮：力、质量和加速度联系在一起。', 'A new law lights up: force, mass, and acceleration now fit together.'),
  law_third: text('你看见了相互作用的另一半：力总是成对出现。', 'You see the other half of every interaction: forces come in pairs.'),
  law_gravity: text('苹果和月亮连在了一起：你发现了万有引力。', 'The apple and the Moon are connected: you have discovered universal gravitation.'),
  write_principia: text('地上和天上的运动，终于可以用同一套规律解释。', 'Motion on Earth and motion in the sky can finally be explained by the same laws.'),
  law_charge: text('你给这种看不见的电性起了名字：电荷。', 'You give this invisible electric property a name: charge.'),
  law_currentMagnetism: text('电流和磁针回应了彼此：电和磁开始连接。', 'Current and compass answer each other: electricity and magnetism begin to connect.'),
  law_induction: text('你发现了关键：不是磁铁本身，而是磁场的变化。', 'You find the key: not the magnet by itself, but the changing magnetic field.'),
  law_maxwell: text('电、磁和光在同一幅图里合在一起。', 'Electricity, magnetism, and light now belong to one picture.'),
  law_electricPower: text('电不再只是现象，它可以变成机器和城市的力量。', 'Electricity is no longer just a phenomenon; it can power machines and cities.'),
  law_radio: text('信息离开导线，第一次穿过空气到达远方。', 'Information leaves the wire and travels through the air for the first time.'),
  law_energy: text('你发现：能量不会消失，只会改变形式。', 'You discover that energy does not disappear; it changes form.'),
  law_entropy: text('你看见了时间的方向：自然过程不会随意倒流。', 'You see the direction of time: natural processes do not simply run backward.'),
  law_sound: text('声音不再神秘：它是介质中的振动向外传播。', 'Sound is no longer mysterious: it is vibration traveling through a medium.'),
  law_optics: text('光开始显露波的样子：它会弯曲、叠加，也会形成图样。', 'Light begins to show its wave nature: it bends, overlaps, and forms patterns.'),
  law_specialRelativity: text('你放下了绝对时间：光速不变，时间和空间会改变。', 'You let go of absolute time: light speed is constant, while time and space can change.'),
  law_generalRelativity: text('引力不再只是拉力，它成为弯曲的时空。', 'Gravity is no longer just a pull; it becomes curved spacetime.'),
  law_atom: text('原子不再是实心小球：里面有原子核和电子。', 'The atom is no longer a solid ball: it contains a nucleus and electrons.'),
  law_quanta: text('能量不再像水一样连续流动，它可以一份一份出现。', 'Energy no longer flows only like water; it can arrive in packets.'),
  law_quantum: text('微观世界打开了：你不能总是知道确定轨道，只能描述概率。', 'The microscopic world opens: you cannot always know a definite path, only probabilities.'),
  law_nuclearAge: text('暗室最后一次亮起：核能带来力量，也带来选择。', 'The room lights up one last time: nuclear energy brings power, and also choice.')
}

function theoryToastText(action, lang) {
  if (THEORY_TOASTS[action.id]) return pick(THEORY_TOASTS[action.id], lang)

  const label = pick(action.label, lang)
  if (lang === 'zh') {
    return `你提出了新的规律：${label}。`
  }

  const patterns = [
    [/^Discover (.+)$/, 'You have discovered $1.'],
    [/^Establish (.+)$/, 'You have established $1.'],
    [/^Define (.+)$/, 'You have defined $1.'],
    [/^Understand (.+)$/, 'You now understand $1.'],
    [/^Build (.+)$/, 'You have built $1.'],
    [/^Enter (.+)$/, 'You have entered $1.'],
    [/^Write (.+)$/, 'You have written $1.'],
    [/^Propose (.+)$/, 'You have proposed $1.']
  ]
  for (const [pattern, template] of patterns) {
    const match = label.match(pattern)
    if (match) return template.replace('$1', match[1])
  }
  return `You have proposed a new law: ${label}.`
}

Page({
  data: {
    title: '牛顿的暗室',
    scene: '',
    goal: '',
    phaseLabel: '第一问',
    actions: [],
    resources: [],
    workers: [],
    logs: [],
    feedback: '',
    ui: {},
    lang: 'zh'
  },

  onLoad() {
    const saved = wx.getStorageSync(STORAGE_KEY)
    this.state = saved ? migrateSavedState({ ...cloneState(START_STATE), ...saved }) : cloneState(START_STATE)
    if (!this.state.lang) this.state.lang = 'zh'
    if (!this.state.maxEnergy) this.state.maxEnergy = BASE_MAX_ENERGY
    if (this.state.energy === undefined) this.state.energy = this.state.maxEnergy
    if (this.state.insight === undefined) this.state.insight = 0
    if (this.state.doubt === undefined) this.state.doubt = 1
    this.render()
    if (!wx.getStorageSync('physics_darkroom_tutorial_seen_v2')) {
      this.showOnboarding()
    }
  },

  showOnboarding() {
    // Step 1: language selection
    showOverlay({
      title: '物理暗室 · Physics Dark Room',
      html: '<p style="text-align:center;color:#9a917f;font-size:14px;margin:4px 0 0">请选择语言 · Please select a language</p>',
      buttons: [
        {
          text: '中文',
          primary: true,
          onClick: () => {
            this.state.lang = 'zh'
            this.render()
            wx.setStorageSync('physics_darkroom_tutorial_seen_v2', true)
            showOverlay({
              title: pick(TUTORIAL.title, 'zh'),
              html: pick(TUTORIAL.html, 'zh'),
              buttons: [{ text: '开始游戏', primary: true }]
            })
          }
        },
        {
          text: 'English',
          onClick: () => {
            this.state.lang = 'en'
            this.render()
            wx.setStorageSync('physics_darkroom_tutorial_seen_v2', true)
            showOverlay({
              title: pick(TUTORIAL.title, 'en'),
              html: pick(TUTORIAL.html, 'en'),
              buttons: [{ text: 'Start Game', primary: true }]
            })
          }
        }
      ]
    })
  },

  onHide() {
    this.save()
  },

  switchLanguage() {
    this.state.lang = this.state.lang === 'zh' ? 'en' : 'zh'
    this.afterChange()
  },

  openChapterSelect() {
    const lang = this.state.lang || 'zh'
    const currentChapter = this.state.chapter
    // Use maxChapterReached so jumping back doesn't hide later unlocked chapters
    const maxChapterReached = Math.max(this.state.maxChapterReached || 0, currentChapter)

    const root = document.getElementById('modal-root')
    root.innerHTML = ''
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'

    const box = document.createElement('div')
    box.className = 'modal-box'

    const titleEl = document.createElement('div')
    titleEl.className = 'modal-title'
    titleEl.textContent = lang === 'zh' ? '选择章节' : 'Select Chapter'
    box.appendChild(titleEl)

    const hint = document.createElement('div')
    hint.style.cssText = 'font-size:13px;color:#9a917f;margin:8px 0 12px'
    hint.textContent = lang === 'zh'
      ? (maxChapterReached === 0 ? '完成更多章节后，可在此处回到任意已解锁的章节。' : '可回到任意已解锁的章节重新探索。')
      : (maxChapterReached === 0 ? 'Complete more chapters to unlock chapter select.' : 'Return to any chapter you have already reached.')
    box.appendChild(hint)

    const list = document.createElement('div')
    list.style.cssText = 'display:grid;gap:6px;max-height:55vh;overflow-y:auto;padding-right:4px'

    CHAPTERS.forEach((ch, idx) => {
      if (idx > maxChapterReached) return  // only show unlocked chapters
      const btn = document.createElement('button')
      const isCurrent = idx === currentChapter
      btn.style.cssText = `width:100%;padding:9px 12px;border-radius:9px;text-align:left;cursor:pointer;font:inherit;
        border:1px solid ${isCurrent ? 'rgba(214,127,64,.62)' : 'rgba(222,216,200,.14)'};
        background:${isCurrent ? '#332216' : '#1a1916'};
        color:${isCurrent ? '#fff3dd' : '#cfc6b4'};`
      btn.innerHTML = `<span style="font-size:12px;color:#9a917f;display:block;margin-bottom:2px">${escapeHtml(pick(ch.label, lang))} &nbsp;${idx + 1}/${CHAPTERS.length}</span>
        <span style="font-size:14px;font-weight:700">${escapeHtml(pick(ch.title, lang))}</span>`
      btn.addEventListener('click', () => {
        root.innerHTML = ''
        this.jumpToChapter(idx)
      })
      list.appendChild(btn)
    })

    box.appendChild(list)

    const cancelBtn = document.createElement('button')
    cancelBtn.className = 'modal-button'
    cancelBtn.style.cssText = 'width:100%;margin-top:12px'
    cancelBtn.textContent = lang === 'zh' ? '取消' : 'Cancel'
    cancelBtn.addEventListener('click', () => { root.innerHTML = '' })
    box.appendChild(cancelBtn)

    overlay.appendChild(box)
    root.appendChild(overlay)
    overlay.addEventListener('click', (e) => { if (e.target === overlay) root.innerHTML = '' })
  },

  jumpToChapter(targetChapter) {
    const lang = this.state.lang || 'zh'
    // Remember the highest chapter ever reached so it survives the state reset
    const prevMaxChapter = Math.max(this.state.maxChapterReached || 0, this.state.chapter)
    const newState = cloneState(START_STATE)
    newState.lang = lang

    // Mark all previous chapters' laws as completed
    for (let i = 0; i < targetChapter; i++) {
      ;(CHAPTER_LAW_KEYS[i] || []).forEach(key => { newState.laws[key] = true })
    }

    newState.chapter = targetChapter
    newState.maxChapterReached = Math.max(prevMaxChapter, targetChapter)
    newState.maxEnergy = BASE_MAX_ENERGY + targetChapter * ENERGY_PER_CHAPTER
    newState.energy = newState.maxEnergy
    newState.logs = [{
      time: 0,
      text: text(
        `你跳转到第 ${targetChapter + 1} 章：${pick(CHAPTERS[targetChapter].title, 'zh')}。前面的规律已自动解锁。`,
        `You jumped to Chapter ${targetChapter + 1}: ${pick(CHAPTERS[targetChapter].title, 'en')}. Previous laws are unlocked.`
      )
    }]

    this.state = newState
    if (wx.removeStorageSync) wx.removeStorageSync(STORAGE_KEY)
    this.render()
  },

  openResetMenu() {
    const lang = this.state.lang || 'zh'
    wx.showActionSheet({
      itemList: [pick(UI.resetChapter, lang), pick(UI.resetAll, lang)],
      success: (result) => {
        if (result.tapIndex === 0) this.resetChapter()
        if (result.tapIndex === 1) this.resetGame()
      }
    })
  },

  resetChapter() {
    const chapter = this.state.complete ? CHAPTERS.length - 1 : this.state.chapter
    clearProgressFromChapter(this.state, chapter)
    this.state.chapter = chapter
    this.state.complete = false
    this.state.energy = this.state.maxEnergy
    this.state.feedback = null
    // Clean up actionOrder: remove actions from cleared chapters
    if (this.state.actionOrder) {
      const clearedKeys = []
      for (let i = chapter; i < CHAPTERS.length; i++) {
        clearedKeys.push(...(CHAPTER_FACT_KEYS[i] || []), ...(CHAPTER_LAW_KEYS[i] || []))
      }
      this.state.actionOrder = this.state.actionOrder.filter((id) => !clearedKeys.includes(id))
    }
    this.log(text(
      '你重开了本章。前面已经发现的规律仍然保留。',
      'You restarted this chapter. Earlier discoveries remain.'
    ))
    this.afterChange()
  },

  resetGame() {
    const lang = this.state.lang || 'zh'
    this.state = cloneState(START_STATE)
    this.state.lang = lang
    if (wx.removeStorageSync) wx.removeStorageSync(STORAGE_KEY)
    this.render()
    // Clear tutorial flag so onboarding shows again on reset
    if (wx.removeStorageSync) wx.removeStorageSync('physics_darkroom_tutorial_seen_v2')
    this.showOnboarding()
  },

  handleAction(event) {
    const id = event.currentTarget.dataset.id
    const s  = this.state
    const lang = s.lang || 'zh'

    // ── analysis_mid: intermediate deduction step ──────────────────────────
    if (id === 'analysis_mid') {
      const before = snapshotResources(s)
      s.energy -= 1
      s.insight += 1
      s.facts['analysis_mid_' + s.chapter] = true
      const analysisData = CHAPTER_ANALYSIS[s.chapter] || CHAPTER_ANALYSIS[0]
      const msg = analysisData.midResult || text(
        '你仔细审视已有的证据，脑中的线索开始连成一条线。',
        'You examine the evidence carefully — the clues start to connect.'
      )
      this.log(msg)
      const after = snapshotResources(s)
      const kind = pick(analysisData.midKind, lang)
      showResultPopup({ kind, body: pick(msg, lang), deltaHtml: buildDeltaHtml(before, after, lang), lang, onClose: () => this.afterChange() })
      return
    }

    // ── analysis_final: trigger theory discovery (uses its own big overlay) ─
    if (id === 'analysis_final') {
      const theory = findContentReadyTheory(s)
      if (theory && s.energy >= THEORY_MIN_ENERGY && s.doubt <= THEORY_MAX_DOUBT) {
        this.discoverTheory(theory)
      }
      this.afterChange()
      return
    }

    // ── rest ───────────────────────────────────────────────────────────────
    if (id === 'new_day') {
      const before = snapshotResources(s)
      s._restOption = null
      s._restOptions = null
      this.newDay()   // calls this.log() internally
      const after = snapshotResources(s)
      const body = s.logs[0] ? pick(s.logs[0].text, lang) : ''
      showResultPopup({ kind: pick(UI.kinds.rest, lang), body, deltaHtml: buildDeltaHtml(before, after, lang), lang, onClose: () => this.afterChange() })
      return
    }

    // ── insight spark ──────────────────────────────────────────────────────
    if (id === 'insight_spark') {
      const before = snapshotResources(s)
      s.doubt -= 2
      s.insight += 2
      const msg = text(
        '你把那些无处安放的困惑翻过来，发现它们指向了同一个方向。疑虑不再是阻碍，而是路标。',
        'You turn your restless doubts over and find they all point the same way. Confusion is no longer an obstacle; it becomes a signpost.'
      )
      this.log(msg)
      const after = snapshotResources(s)
      showResultPopup({ kind: lang === 'zh' ? '灵光乍现' : 'Spark', body: pick(msg, lang), deltaHtml: buildDeltaHtml(before, after, lang), lang, onClose: () => this.afterChange() })
      return
    }

    // ── reflect (organize thoughts) ────────────────────────────────────────
    if (id === 'reflect') {
      const before = snapshotResources(s)
      s.energy -= 2
      s.doubt -= Math.min(s.doubt, 2)
      const msgs = [
        text('你放下笔，重新翻看之前的记录，理出了一条清晰的脉络。', 'You set down your pen and review past notes, finding a clear thread.'),
        text('深呼一口气，把混乱的想法一一写下，灵感渐渐清晰。', 'A deep breath — you write down the tangled thoughts one by one. Clarity returns.'),
        text('你把疑问分成小块，逐一审视。混乱开始消散。', 'You break your doubts into pieces and examine each in turn. The fog begins to lift.'),
      ]
      const msg = msgs[Math.floor(Math.random() * msgs.length)]
      this.log(msg)
      const after = snapshotResources(s)
      showResultPopup({ kind: lang === 'zh' ? '整理' : 'Reflect', body: pick(msg, lang), deltaHtml: buildDeltaHtml(before, after, lang), lang, onClose: () => this.afterChange() })
      return
    }

    // ── normal ACTIONS ─────────────────────────────────────────────────────
    const action = ACTIONS.find((item) => item.id === id)
    if (!action || !canRun(s, action)) return

    const before = snapshotResources(s)

    // Energy cost
    const cost = action.type === 'theory' ? THEORY_ENERGY_COST : ACTION_ENERGY_COST
    s.energy -= cost

    const message = action.run(s)
    if (action.once) {
      s.facts[action.id] = true
      if (action.type === 'experiment') s.feedback = null
    }
    if (!s.actionOrder) s.actionOrder = []
    if (!s.actionOrder.includes(id)) s.actionOrder.push(id)

    // Plan A: misconception doubt buffered by insight
    if (action.type === 'misconception') {
      if (s.insight >= INSIGHT_REQUIRE && Math.random() < 0.5) {
        setTimeout(() => showToast(lang === 'zh' ? '💡 灵感缓冲了困惑，灵感没有乱。' : '💡 Your insight absorbed the confusion.', 'event-good', 2500), 300)
      } else {
        s.doubt += 1
      }
    }

    // Plan C: exhaustion suppresses insight gain
    if (action.type === 'intuition') {
      if (s.energy <= ENERGY_INSIGHT_THRESHOLD) {
        setTimeout(() => showToast(lang === 'zh' ? '😓 精力不足，猜测未能转化为灵感。' : '😓 Too exhausted to turn this guess into insight.', 'event-bad', 2500), 300)
      } else {
        s.insight += 1
      }
    }

    // Plan D: excess manuscripts spark insight
    if (action.type === 'experiment') {
      const minRec = CHAPTER_MIN_RECORDS[s.chapter] ?? 3
      const excessThreshold = minRec + EXCESS_RECORDS_BONUS
      if (excessThreshold > 0 && s.records === excessThreshold) {
        s.insight += 1
        setTimeout(() => showToast(lang === 'zh' ? '📚 反复钻研，灵光乍现！+1 灵感' : '📚 Deep study pays off — a flash of insight! +1 Insight', 'event-good', 3000), 300)
      }
    }

    // Combo tracking
    if (action.type === 'experiment' || action.type === 'intuition') {
      _comboCount++
      if (_comboCount > 0 && _comboCount % 3 === 0) {
        s.insight += 1
        setTimeout(() => showToast(lang === 'zh' ? `⚡ 灵感清晰！连续 ${_comboCount} 次成功  +1 灵感` : `⚡ On a roll! ${_comboCount} in a row  +1 Insight`, 'combo', 3000), 500)
      }
    } else if (action.type === 'misconception') {
      _comboCount = 0
    }

    // Random lab event
    _totalActions++
    if (action.type === 'experiment' || action.type === 'intuition' || action.type === 'misconception') {
      maybeLabEvent(s, _totalActions, lang)
    }

    const after = snapshotResources(s)
    this.log(message)

    // invent_calculus: special landmark overlay (keep as-is, no result popup)
    if (action.id === 'invent_calculus') {
      const isZh = lang === 'zh'
      showOverlay({
        title: isZh ? '✨ 发现：微积分' : '✨ Discovery: Calculus',
        html: isZh
          ? `<div style="font-size:14px;line-height:1.75;color:#cfc6b4">
               <p style="margin:0 0 12px">你把运动切成无数个无限小的瞬间——这不只是一种计算技巧，而是一门全新的数学语言。</p>
               <div style="padding:10px 14px;border-left:3px solid rgba(214,127,64,.7);background:rgba(214,127,64,.08);border-radius:0 6px 6px 0;margin-bottom:12px;font-style:italic;color:#eadfcb">
                 "想要描述运动，就必须能描述每一瞬间的变化。" — 牛顿
               </div>
               <p style="margin:0;color:#9a917f;font-size:13px">微积分将成为未来两百年物理学最核心的工具。F = ma 正等着用它来严格表达。</p>
             </div>`
          : `<div style="font-size:14px;line-height:1.75;color:#cfc6b4">
               <p style="margin:0 0 12px">You have sliced motion into infinitely small instants — not just a trick of calculation, but an entirely new mathematical language.</p>
               <div style="padding:10px 14px;border-left:3px solid rgba(214,127,64,.7);background:rgba(214,127,64,.08);border-radius:0 6px 6px 0;margin-bottom:12px;font-style:italic;color:#eadfcb">
                 "To describe motion, you must be able to describe change at every instant." — Newton
               </div>
               <p style="margin:0;color:#9a917f;font-size:13px">Calculus will become the core tool of physics for the next two centuries. F = ma is waiting to be stated precisely with it.</p>
             </div>`,
        buttons: [{ text: isZh ? '继续' : 'Continue', primary: true }]
      })
      this.afterChange()
      return
    }

    // All other actions → result popup
    showResultPopup({
      kind: actionKind(action, lang),
      body: pick(message, lang),
      deltaHtml: buildDeltaHtml(before, after, lang),
      lang,
      onClose: () => this.afterChange()
    })
  },

  discoverTheory(action) {
    const cost = THEORY_ENERGY_COST
    this.state.energy -= cost
    const prevChapter = this.state.chapter
    const message = action.run(this.state)
    // Track theory in action order
    const s = this.state
    if (!s.actionOrder) s.actionOrder = []
    if (!s.actionOrder.includes(action.id)) s.actionOrder.push(action.id)
    this.log(message)
    this.showTheoryToast(action, prevChapter)
  },

  showTheoryToast(action, prevChapter) {
    const lang = this.state.lang || 'zh'
    const s = this.state
    const chapterData = CHAPTERS[prevChapter]
    const chapterNum = prevChapter + 1
    const totalChapters = CHAPTERS.length
    const nextChapterNum = chapterNum + 1

    // Count experiments/intuitions done in this chapter
    const chapterActions = ACTIONS.filter(a => a.chapter === prevChapter && a.type !== 'theory')
    const doneCount = chapterActions.filter(a => s.facts[a.id]).length
    const totalCount = chapterActions.length

    const theoryDesc = theoryToastText(action, lang)
    const chapterTitle = chapterData ? pick(chapterData.title, lang) : ''
    const bridgeText = (chapterData && chapterData.bridge && nextChapterNum <= totalChapters)
      ? pick(chapterData.bridge, lang) : ''

    let html
    if (lang === 'zh') {
      html = `
        <div style="text-align:center;margin-bottom:14px">
          <span style="font-size:12px;color:#9a917f;letter-spacing:.05em">第 ${chapterNum} / ${totalChapters} 章完成</span><br>
          <span style="font-size:15px;color:#f1ead8;font-weight:700;line-height:1.4">${escapeHtml(chapterTitle)}</span>
        </div>
        <div style="padding:12px 14px;border-left:3px solid rgba(214,127,64,.7);background:rgba(214,127,64,.08);border-radius:0 6px 6px 0;color:#eadfcb;font-size:14px;line-height:1.6;margin-bottom:14px">${escapeHtml(theoryDesc)}</div>
        <div style="display:flex;gap:10px;font-size:13px;color:#9a917f;margin-bottom:${bridgeText ? '14px' : '0'}">
          <span>📋 本章实验 ${doneCount}/${totalCount}</span>
          <span>⚡ 精力上限 +${ENERGY_PER_CHAPTER}</span>
        </div>
        ${bridgeText ? `<div style="padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(222,216,200,.1);color:#9a917f;font-size:13px;line-height:1.6;font-style:italic">→ ${escapeHtml(bridgeText)}</div>` : ''}`
    } else {
      html = `
        <div style="text-align:center;margin-bottom:14px">
          <span style="font-size:12px;color:#9a917f;letter-spacing:.05em">Chapter ${chapterNum} / ${totalChapters} Complete</span><br>
          <span style="font-size:15px;color:#f1ead8;font-weight:700;line-height:1.4">${escapeHtml(chapterTitle)}</span>
        </div>
        <div style="padding:12px 14px;border-left:3px solid rgba(214,127,64,.7);background:rgba(214,127,64,.08);border-radius:0 6px 6px 0;color:#eadfcb;font-size:14px;line-height:1.6;margin-bottom:14px">${escapeHtml(theoryDesc)}</div>
        <div style="display:flex;gap:10px;font-size:13px;color:#9a917f;margin-bottom:${bridgeText ? '14px' : '0'}">
          <span>📋 Experiments ${doneCount}/${totalCount}</span>
          <span>⚡ Max Energy +${ENERGY_PER_CHAPTER}</span>
        </div>
        ${bridgeText ? `<div style="padding:10px 12px;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(222,216,200,.1);color:#9a917f;font-size:13px;line-height:1.6;font-style:italic">→ ${escapeHtml(bridgeText)}</div>` : ''}`
    }

    const isComplete = nextChapterNum > totalChapters
    showOverlay({
      title: lang === 'zh' ? '理论成立' : 'Theory Established',
      html,
      buttons: [{
        text: lang === 'zh'
          ? (isComplete ? '查看物理史年表' : `进入第 ${nextChapterNum} 章`)
          : (isComplete ? 'View Physics Timeline' : `Enter Chapter ${nextChapterNum}`),
        primary: true,
        onClick: isComplete ? () => this.showEndingTimeline() : undefined
      }]
    })
  },

  showEndingTimeline() {
    const lang = this.state.lang || 'zh'
    const s = this.state
    const zh = lang === 'zh'

    // — Stats —
    const totalDays = s.day
    const lawCount = Object.keys(s.laws).filter(k => s.laws[k]).length
    const conceptCount = FACT_CONCEPTS.filter(c => s.facts[c.key]).length
    const totalLaws = LAW_LIST.length

    // — Achievement badge based on efficiency —
    let badge, badgeColor
    if (zh) {
      if (totalDays < 80)       { badge = '⚡ 效率专家';   badgeColor = '#e8c77a' }
      else if (totalDays < 130) { badge = '🔬 稳健研究者'; badgeColor = '#7ac4e8' }
      else                      { badge = '🌌 执着探索者'; badgeColor = '#a87ae8' }
    } else {
      if (totalDays < 80)       { badge = '⚡ Efficiency Expert';      badgeColor = '#e8c77a' }
      else if (totalDays < 130) { badge = '🔬 Methodical Researcher';  badgeColor = '#7ac4e8' }
      else                      { badge = '🌌 Persistent Explorer';     badgeColor = '#a87ae8' }
    }

    // — Era groupings —
    const ERAS = zh
      ? [
          { label: '经典力学', keys: ['inertia', 'second', 'third', 'gravity', 'principia'] },
          { label: '电磁学', keys: ['charge', 'currentMagnetism', 'induction', 'maxwell', 'electricPower', 'radio'] },
          { label: '热力学与波动', keys: ['energy', 'entropy', 'sound', 'optics'] },
          { label: '相对论', keys: ['specialRelativity', 'generalRelativity'] },
          { label: '量子与核', keys: ['atom', 'quanta', 'quantum', 'nuclearAge'] }
        ]
      : [
          { label: 'Classical Mechanics', keys: ['inertia', 'second', 'third', 'gravity', 'principia'] },
          { label: 'Electromagnetism', keys: ['charge', 'currentMagnetism', 'induction', 'maxwell', 'electricPower', 'radio'] },
          { label: 'Thermodynamics & Waves', keys: ['energy', 'entropy', 'sound', 'optics'] },
          { label: 'Relativity', keys: ['specialRelativity', 'generalRelativity'] },
          { label: 'Quantum & Nuclear', keys: ['atom', 'quanta', 'quantum', 'nuclearAge'] }
        ]

    // — Build HTML —
    let html = ''

    // Header: congrats + badge
    html += `
      <div style="text-align:center;padding:8px 0 20px">
        <div style="font-size:36px;margin-bottom:10px">🔭</div>
        <div style="font-size:19px;font-weight:700;color:#f1ead8;line-height:1.4;margin-bottom:8px">
          ${zh ? '物理世界建立完成' : 'The Physics World Is Built'}
        </div>
        <div style="font-size:13px;color:#9a917f;line-height:1.6;margin-bottom:14px">
          ${zh
            ? '你从最简单的运动出发，重走了三百年物理学之路。'
            : 'You retraced three centuries of physics, starting from the simplest motion.'}
        </div>
        <span style="display:inline-block;padding:5px 14px;border-radius:20px;background:rgba(255,255,255,.07);
          border:1px solid rgba(255,255,255,.12);font-size:13px;font-weight:600;color:${badgeColor}">
          ${badge}
        </span>
      </div>`

    // Stats row
    html += `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:22px">
        <div style="text-align:center;padding:12px 6px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)">
          <div style="font-size:26px;font-weight:700;color:#e8c77a;line-height:1">${totalDays}</div>
          <div style="font-size:11px;color:#9a917f;margin-top:4px">${zh ? '总轮次' : 'Total Rounds'}</div>
        </div>
        <div style="text-align:center;padding:12px 6px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)">
          <div style="font-size:26px;font-weight:700;color:#e8c77a;line-height:1">${lawCount}/${totalLaws}</div>
          <div style="font-size:11px;color:#9a917f;margin-top:4px">${zh ? '定律发现' : 'Laws Found'}</div>
        </div>
        <div style="text-align:center;padding:12px 6px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)">
          <div style="font-size:26px;font-weight:700;color:#e8c77a;line-height:1">${conceptCount}</div>
          <div style="font-size:11px;color:#9a917f;margin-top:4px">${zh ? '概念习得' : 'Concepts'}</div>
        </div>
      </div>`

    // Timeline of eras
    html += `<div style="font-size:12px;color:#6b6455;letter-spacing:.06em;margin-bottom:12px;text-transform:uppercase">
      ${zh ? '发现年表' : 'Discovery Timeline'}
    </div>`

    ERAS.forEach(era => {
      html += `<div style="margin-bottom:14px">
        <div style="font-size:11px;color:#d67f40;letter-spacing:.06em;margin-bottom:6px;text-transform:uppercase">${escapeHtml(era.label)}</div>
        <div style="display:grid;gap:4px">`

      era.keys.forEach(key => {
        const law = LAW_LIST.find(l => l.key === key)
        if (!law) return
        const discovered = !!s.laws[key]
        html += `<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:6px;
          background:${discovered ? 'rgba(90,158,111,.1)' : 'rgba(255,255,255,.025)'};
          border:1px solid ${discovered ? 'rgba(90,158,111,.25)' : 'rgba(222,216,200,.06)'}">
          <span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;background:${discovered ? '#5a9e6f' : 'rgba(150,140,130,.25)'}"></span>
          <span style="flex:1;min-width:0">
            <span style="font-size:13px;font-weight:600;color:${discovered ? '#dccf8a' : '#5a5248'}">${escapeHtml(pick(law.name, lang))}</span>
            <span style="font-size:12px;color:${discovered ? '#7a8f7a' : '#433e39'};margin-left:8px">${escapeHtml(pick(law.task, lang))}</span>
          </span>
          ${discovered ? '<span style="font-size:11px;color:#5a9e6f">✓</span>' : ''}
        </div>`
      })

      html += '</div></div>'
    })

    // Closing quote
    html += `
      <div style="margin-top:18px;padding:14px 16px;border-radius:8px;background:rgba(255,255,255,.04);
        border:1px solid rgba(222,216,200,.1);font-size:13px;color:#9a917f;line-height:1.7;font-style:italic;text-align:center">
        ${zh
          ? '"自然界的一切，都以最简单的方式运作。" — 牛顿'
          : '"Nature does nothing in vain." — Newton'}
      </div>`

    // — Render —
    const root = document.getElementById('modal-root')
    root.innerHTML = ''
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    const box = document.createElement('div')
    box.className = 'modal-box'

    const titleEl = document.createElement('div')
    titleEl.className = 'modal-title'
    titleEl.textContent = zh ? '🎉 完结' : '🎉 Complete'
    box.appendChild(titleEl)

    const content = document.createElement('div')
    content.className = 'modal-content'
    content.innerHTML = html
    box.appendChild(content)

    const btnRow = document.createElement('div')
    btnRow.style.cssText = 'display:flex;gap:8px;margin-top:16px'

    const restartBtn = document.createElement('button')
    restartBtn.className = 'modal-button'
    restartBtn.style.cssText = 'flex:1'
    restartBtn.textContent = zh ? '重新开始' : 'Play Again'
    restartBtn.addEventListener('click', () => {
      root.innerHTML = ''
      this.resetGame()
    })

    const closeBtn = document.createElement('button')
    closeBtn.className = 'modal-button primary'
    closeBtn.style.cssText = 'flex:1'
    closeBtn.textContent = zh ? '关闭' : 'Close'
    closeBtn.addEventListener('click', () => { root.innerHTML = '' })

    btnRow.appendChild(restartBtn)
    btnRow.appendChild(closeBtn)
    box.appendChild(btnRow)

    overlay.appendChild(box)
    root.appendChild(overlay)
  },

  newDay() {
    const s = this.state
    s.day += 1
    _comboCount = 0  // rest breaks the combo

    // Pick a random rest option and apply its effects
    const restOpt = s._restOption || REST_OPTIONS[Math.floor(Math.random() * REST_OPTIONS.length)]
    const effects = restOpt.effects || [{ p: 1, desc: text('你休息了一会儿。', 'You rest for a while.'), energy: 5, insight: 0, doubt: 0 }]

    // Weighted random selection
    const roll = Math.random()
    let cumulative = 0
    let chosen = effects[effects.length - 1]
    for (const eff of effects) {
      cumulative += eff.p
      if (roll <= cumulative) { chosen = eff; break }
    }

    // Apply effects
    let energyGain = chosen.energy || 5

    // Plan B: high doubt reduces rest quality (troubled mind → poor sleep)
    const lang = s.lang || 'zh'
    let doubtPenalty = 0
    if (s.doubt >= DOUBT_REST_PENALTY_HARD) doubtPenalty = 2
    else if (s.doubt >= DOUBT_REST_PENALTY_MILD) doubtPenalty = 1
    if (doubtPenalty > 0) {
      energyGain = Math.max(1, energyGain - doubtPenalty)
      const msg = lang === 'zh'
        ? `❓ 满脑子疑问，没睡好。精力恢复 -${doubtPenalty}`
        : `❓ Too many questions, sleep was poor. Energy recovery -${doubtPenalty}`
      setTimeout(() => showToast(msg, 'event-bad', 3000), 300)
    }

    s.energy = Math.min(s.maxEnergy, s.energy + energyGain)

    // Apply insight/doubt from the chosen rest event (these come from REST_OPTIONS effects)
    if (chosen.insight) s.insight = Math.max(0, s.insight + chosen.insight)
    if (chosen.doubt)   s.doubt   = Math.max(0, s.doubt   + chosen.doubt)

    this.log(chosen.desc)
  },

  afterChange() {
    const s = this.state
    // Keep track of the highest chapter ever reached so the chapter selector
    // never shrinks when the player jumps back to an earlier chapter
    s.maxChapterReached = Math.max(s.maxChapterReached || 0, s.chapter)
    // Check for doubt confusion
    if (s.doubt >= DOUBT_LOCK && s.insight < INSIGHT_REQUIRE) {
      s.feedback = UI.doubtConfused
    } else if (s.doubt >= DOUBT_LOCK && s.insight >= INSIGHT_SPARK) {
      s.feedback = UI.insightSpark
    } else {
      s.feedback = null
    }
    this.render()
    this.save()
  },

  getActions() {
    const s = this.state
    const lang = s.lang || 'zh'
    if (s.complete) return []

    const readyTheory = findReadyTheory(s)
    const pendingTheory = !readyTheory ? findPendingTheory(s) : null
    const confused = s.doubt >= DOUBT_LOCK && s.insight < INSIGHT_REQUIRE
    const sparking = s.doubt >= DOUBT_LOCK && s.insight >= INSIGHT_SPARK

    // 检测某个动作是否已被当前 facts 永久锁死
    // 用 Proxy 把 facts 中所有访问都返回 true，若此时 requires 仍为 false
    // 说明它依赖某个 "!fact" 条件，而该 fact 现在已为 true，无法再撤回
    function isPermanentlyBlocked(action) {
      if (!action.requires) return false
      const allTrueFacts = new Proxy({}, { get: () => true })
      const testState = Object.assign({}, s, {
        energy: 999, insight: 999, records: 999, predictions: 999,
        facts: allTrueFacts
      })
      return !action.requires(testState)
    }

    const chapterActions = ACTIONS
      .filter((action) => action.chapter === s.chapter)
      .filter((action) => action.type !== 'theory')
      .filter((action) => !action.visible || action.visible(s))
      .filter((action) => !action.once || !s.facts[action.id])
      .map((action) => {
        const blocked = confused || isInsightBlocked(s, action)
        const runnable = Boolean(canRun(s, action))
        const prereqMissing = !runnable && s.energy > 0 && !blocked
        return {
          id: action.id,
          label: pick(action.label, lang),
          hint: pick(action.hint, lang),
          kind: actionKind(action, lang),
          primary: action.type === 'theory',
          type: action.type,
          enabled: !blocked && runnable,
          locked: blocked
            ? confused
              ? pick(UI.doubtConfused, lang)
              : pick(text('灵感不足，需要更多思考', 'Not enough insight. Think more.'), lang)
            : prereqMissing
              ? pick(text('需要先完成前置步骤', 'Prerequisites not yet met'), lang)
              : ''
        }
      })

    const enabledExperiments = chapterActions.filter((a) => a.enabled && (a.type === 'experiment' || a.type === 'intuition'))
    // 只将"将来仍可能解锁"的禁用行动作为预览展示，过滤掉已因 !fact 条件永久失效的
    const disabledExperiments = chapterActions.filter((a) => {
      if (a.enabled) return false
      if (a.type !== 'experiment' && a.type !== 'intuition') return false
      const originalAction = ACTIONS.find(ac => ac.id === a.id)
      if (!originalAction) return true
      return !isPermanentlyBlocked(originalAction)
    })
    const enabledMisconceptions = chapterActions.filter((a) => a.enabled && a.type === 'misconception')
    const visible = []

    // Show available experiments / intuitions (up to 2 enabled)
    enabledExperiments.slice(0, 2).forEach((a) => visible.push(a))

    // If fewer than 2 enabled, fill with temporarily-disabled ones as a "coming soon" preview
    // (permanently-expired ones whose !fact window has closed are already excluded above)
    if (enabledExperiments.length < 2) {
      disabledExperiments.slice(0, 2 - enabledExperiments.length).forEach((a) => visible.push(a))
    }

    // Only show a misconception when it is actually available (skip expired ones whose window has passed)
    const shownMisconception = enabledMisconceptions[0]
    if (shownMisconception) visible.push(shownMisconception)

    // 灵光乍现：困惑高但灵感足够时出现特殊选项
    if (sparking) {
      visible.push({
        id: 'insight_spark',
        label: pick(text('将困惑化为方向', 'Transform Doubt Into Direction'), lang),
        hint: pick(text('灵感 ≥ 3，困惑 ≥ 5：把疑虑化为突破的线索', 'Doubt becomes a clue for breakthrough'), lang),
        kind: pick(text('灵感', 'Spark'), lang),
        type: 'intuition',
        primary: false,
        enabled: true,
        locked: ''
      })
    }

    // === 2-step Discovery Sequence (replaces the old "Propose Theory" button) ===
    const analysisData = CHAPTER_ANALYSIS[s.chapter] || CHAPTER_ANALYSIS[0]
    const midKey = 'analysis_mid_' + s.chapter
    const midDone = !!s.facts[midKey]

    // Synthesis/closure chapters (like Ch4) have no experiments, so records can't grow.
    // For those chapters, allow analysis_mid to appear immediately (no records gate).
    const chapterHasExperiments = ACTIONS.some(a =>
      a.chapter === s.chapter && (a.type === 'experiment' || a.type === 'intuition')
    )
    const midRecordsThreshold = chapterHasExperiments ? 2 : 0

    // Step 1 — Intermediate analysis: appears once player has enough records and not yet done
    if (s.records >= midRecordsThreshold && !midDone) {
      const canAnalyze = s.energy >= 1 && !confused
      visible.push({
        id: 'analysis_mid',
        label: pick(analysisData.mid, lang),
        hint: canAnalyze
          ? pick(text('整理当前证据，获得灵感 +1', 'Organize current evidence — Insight +1'), lang)
          : !canAnalyze && s.energy < 1
            ? pick(text('精力不足，请先休息', 'Not enough energy — rest first'), lang)
            : pick(UI.doubtConfused, lang),
        kind: pick(analysisData.midKind, lang),
        type: 'deduce',
        primary: false,
        enabled: canAnalyze,
        locked: canAnalyze ? '' : (!canAnalyze && s.energy < 1
          ? pick(text('精力不足', 'Not enough energy'), lang)
          : pick(UI.doubtConfused, lang))
      })
    }

    // Step 2 — Final research action: always shown once analysis_mid is done
    // Even when content conditions aren't met yet, show it disabled so the player knows where they're headed
    if (midDone) {
      const contentTheory = findContentReadyTheory(s)
      // Find any chapter theory (to show the button even when canRun is false)
      const chapterTheory = contentTheory || ACTIONS.find((a) =>
        a.type === 'theory' && a.chapter === s.chapter && (!a.visible || a.visible(s))
      )
      if (chapterTheory) {
        const contentReady = !!contentTheory
        const fullyReady = contentReady && s.energy >= THEORY_MIN_ENERGY && s.doubt <= THEORY_MAX_DOUBT
        const reasons = []
        if (!contentReady) {
          reasons.push(lang === 'zh'
            ? '还有实验或直觉需要完成'
            : 'More experiments or intuitions still needed')
        }
        if (contentReady && s.doubt > THEORY_MAX_DOUBT) {
          reasons.push(lang === 'zh'
            ? `困惑需 ≤ ${THEORY_MAX_DOUBT}（当前 ${s.doubt}，整理思路降低）`
            : `Doubt ≤ ${THEORY_MAX_DOUBT} (now ${s.doubt} — organize your thoughts)`)
        }
        if (contentReady && s.energy < THEORY_MIN_ENERGY) {
          reasons.push(lang === 'zh'
            ? `精力需 ≥ ${THEORY_MIN_ENERGY}（当前 ${s.energy}，先休息）`
            : `Energy ≥ ${THEORY_MIN_ENERGY} (now ${s.energy} — rest first)`)
        }
        visible.push({
          id: 'analysis_final',
          label: pick(analysisData.final, lang),
          hint: fullyReady
            ? pick(text('灵感清晰，线索齐全——是时候做出总结了', 'Mind clear, evidence complete — time to draw your conclusion'), lang)
            : (lang === 'zh' ? '还需：' : 'Need: ') + reasons.join(' / '),
          kind: pick(analysisData.finalKind, lang),
          type: 'write',
          primary: true,
          enabled: fullyReady,
          locked: fullyReady ? '' : reasons.join(' / ')
        })
      }
    }

    // 整理思路：困惑 ≥ 2 时出现，消耗 2 精力来降低困惑
    if (s.doubt >= 2) {
      const canReflect = s.energy >= 2
      visible.push({
        id: 'reflect',
        label: pick(text('整理思路', 'Organize Your Thoughts'), lang),
        hint: canReflect
          ? pick(text('需要 2 点精力。困惑 −2。实验不能替你整理思路，这一步必须主动完成。', 'Spend 2 energy. Doubt −2. Experiments cannot clear your thoughts for you; this step must be done directly.'), lang)
          : pick(text('精力不足（需要 2），请先休息', 'Not enough energy (need 2) — rest first'), lang),
        kind: pick(text('整理', 'Reflect'), lang),
        type: 'reflect',
        primary: false,
        enabled: canReflect,
        locked: canReflect ? '' : pick(text('精力不足', 'Not enough energy'), lang)
      })
    }

    // Single rest option always at the bottom
    // When energy is 0 (forced rest), reveal the flavor text; otherwise keep it generic
    if (!s._restOption) s._restOption = REST_OPTIONS[Math.floor(Math.random() * REST_OPTIONS.length)]
    const forcedRest = s.energy <= 0
    visible.push({
      id: 'new_day',
      label: forcedRest
        ? pick(s._restOption.text, lang)
        : pick(text('暂时休息，整理思路', 'Take a break and clear your head'), lang),
      hint: forcedRest
        ? pick(text('精力耗尽，必须休息', 'Energy depleted — must rest'), lang)
        : pick(text('休息恢复精力，随机带来灵感或疑问', 'Recover energy — may bring insight or doubt'), lang),
      kind: pick(UI.kinds.rest, lang),
      type: 'rest',
      primary: false,
      enabled: true
    })

    return visible
  },

  render() {
    const s = this.state
    const lang = s.lang || 'zh'
    const chapter = CHAPTERS[s.chapter]

    this.setData({
      lang,
      ui: {
        reset: pick(UI.reset, lang),
        resetChapter: pick(UI.resetChapter, lang),
        resetAll: pick(UI.resetAll, lang),
        lang: pick(UI.lang, lang),
        concepts: pick(UI.concepts, lang),
        log: pick(UI.log, lang),
        resourceDesc: {
          energy: lang === 'zh' ? '精力：普通行动会消耗 1 点，提出规律通常消耗更多。精力归零时，需要先休息。' : 'Energy: most actions cost 1 energy. Proposing a law usually costs more. If energy reaches 0, rest first.',
          notes: lang === 'zh' ? '记录：已发现的概念总数，代表你的探索进度。' : 'Notes: Total concepts discovered. Your exploration progress.',
          insight: lang === 'zh' ? '灵感：猜对方向+1，解锁隐藏选项。灵感≥3且困惑≥5时触发灵光乍现。' : 'Insight: +1 from a correct guess. Unlocks hidden options. Spark at ≥3 with doubt≥5.',
          doubt: lang === 'zh' ? '困惑：猜错方向+1；某些休息事件也可能+1。困惑≥4且灵感<2时选项被锁定。' : 'Doubt: +1 from a wrong guess; some rest events may also add +1. Options locked at ≥4 with insight<2.'
        }
      },
      title: s.complete ? pick(UI.completeTitle, lang) : pick(chapter.title, lang),
      scene: s.complete ? pick(UI.completeScene, lang) : pick(chapter.scene, lang),
      goal: s.complete ? pick(UI.completeGoal, lang) : pick(chapter.question, lang),
      phaseLabel: s.complete
        ? pick(UI.complete, lang)
        : lang === 'zh'
          ? `${pick(chapter.label, lang)} · 第${s.day}轮 · ${s.chapter + 1}/${CHAPTERS.length} 章`
          : `${pick(chapter.label, lang)} · Round ${s.day} · Ch ${s.chapter + 1}/${CHAPTERS.length}`,
      actions: this.getActions(),
      day: s.day,
      chapter: s.chapter,
      hasFacts: Object.keys(s.facts || {}).length > 0,
      feedback: s.feedback ? pick(s.feedback, lang) : '',
      resources: [
        {
          key: 'energy', label: pick(UI.resources.energy, lang), value: s.energy, maxText: `/${s.maxEnergy}`,
          sub:    lang === 'zh' ? '行动−1 · 休息回复'       : 'Actions −1 · Rest recovers',
          detail: lang === 'zh'
            ? '每次行动会消耗 1 点精力。精力用完时，请先休息。休息会恢复精力，也可能带来新的灵感或新的疑问。每完成一章，精力上限会增加，并自动恢复。'
            : 'Each action costs 1 energy. When depleted, you must rest. Resting recovers energy and may randomly bring insight or doubt depending on the event. Completing a chapter raises your max energy by 2 and fully restores it.'
        },
        {
          key: 'notes', label: pick(UI.resources.notes, lang), value: s.records, maxText: '',
          sub:    lang === 'zh' ? '做实验会增加记录 · 提出规律会使用记录'       : 'Experiments add notes · Laws use notes',
          detail: lang === 'zh'
            ? '做实验会增加记录。记录足够时，才有机会写下规律。提出规律时会用掉一些记录。'
            : 'Experiments give manuscripts (+1). Once you have enough, the "Propose a Law" button appears. Notes are spent when you propose. More manuscripts = closer to advancing.'
        },
        {
          key: 'insight', label: pick(UI.resources.insight, lang), value: s.insight, maxText: '',
          sub:    lang === 'zh' ? '好的猜想会带来灵感 · 提出规律会使用灵感'       : 'Good guesses bring insight · Laws use insight',
          detail: lang === 'zh'
            ? '当你的猜想接近正确方向时，会获得灵感。灵感可以帮助你解锁更深的实验，也能帮助你写下规律。'
            : 'Gained when your guess is correct (+1). Three uses: ① spent when proposing a law (most chapters need 1); ② unlocks advanced experiments when ≥ 2; ③ when ≥ 2, wrong guesses have 50% chance to not add doubt.'
        },
        {
          key: 'doubt', label: pick(UI.resources.doubt, lang), value: s.doubt, maxText: '',
          warning: s.doubt >= DOUBT_LOCK && s.insight < INSIGHT_REQUIRE,
          sub:    lang === 'zh' ? '猜想受阻 +1 · 整理思路 −2'    : 'Wrong guess +1 · Reflect −2',
          detail: lang === 'zh'
            ? `困惑表示你暂时想不清楚。没有被实验支持的猜想会让困惑增加，有些休息事件也会带来新的疑问。困惑太高时，请选择“整理思路”。如果困惑达到 ${DOUBT_LOCK}，而灵感少于 ${INSIGHT_REQUIRE}，行动会被暂时锁定。`
            : `Doubt represents mental confusion. Wrong guesses add +1 doubt; some rest events may also raise it. Only "Organize Your Thoughts" (costs 2 energy) reduces it by 2. 【Warning】If doubt reaches ${DOUBT_LOCK} and insight < ${INSIGHT_REQUIRE}, all actions are locked.`
        }
      ],
      workers: this.getDiscoveries(),
      logs: s.logs.map((item, index) => ({
        key: `${item.time}-${index}`,
        time: item.time,
        text: pick(item.text, lang)
      }))
    })
  },

  getDiscoveries() {
    const lang = this.state.lang || 'zh'
    const s = this.state
    const facts = FACT_CONCEPTS
      .filter((fact) => s.facts[fact.key])
      .map((fact) => ({
        key: fact.key,
        name: pick(fact.name, lang),
        task: pick(fact.task, lang),
        chain: fact.chain || [],
        discovered: true
      }))
    const laws = LAW_LIST
      .filter((law) => s.laws[law.key])
      .map((law) => ({
        key: law.key,
        name: pick(law.name, lang),
        task: pick(law.task, lang),
        chain: law.chain || [],
        discovered: true
      }))
    return facts.concat(laws)
  },

  log(message) {
    const textValue = typeof message === 'string' ? text(message, message) : message
    const last = this.state.logs[0]
    if (last && pick(last.text, this.state.lang || 'zh') === pick(textValue, this.state.lang || 'zh')) return
    this.state.logs.unshift({ time: Date.now(), text: textValue })
    this.state.logs = this.state.logs.slice(0, 120)
  },

  save() {
    wx.setStorageSync(STORAGE_KEY, this.state)
  }
})

// ── Action result popup ────────────────────────────────────────────────────

function snapshotResources(s) {
  return { energy: s.energy, records: s.records, insight: s.insight, doubt: s.doubt, predictions: s.predictions || 0 }
}

function buildDeltaHtml(before, after, lang) {
  const zh = lang !== 'en'
  const cfg = [
    { key: 'energy',      icon: '⚡', labelZh: '精力',  labelEn: 'Energy',   flipSign: false },
    { key: 'records',     icon: '📋', labelZh: '记录',  labelEn: 'Notes',    flipSign: false },
    { key: 'insight',     icon: '💡', labelZh: '灵感',  labelEn: 'Insight',  flipSign: false },
    { key: 'doubt',       icon: '❓', labelZh: '困惑',  labelEn: 'Doubt',    flipSign: true  },
    { key: 'predictions', icon: '🔭', labelZh: '预测',  labelEn: 'Predict.', flipSign: false },
  ]
  return cfg.map(c => {
    const diff = (after[c.key] || 0) - (before[c.key] || 0)
    if (diff === 0) return ''
    const isGood = c.flipSign ? diff < 0 : diff > 0
    const label  = zh ? c.labelZh : c.labelEn
    return `<span class="result-delta ${isGood ? 'delta-good' : 'delta-bad'}">${c.icon} ${diff > 0 ? '+' : ''}${diff} ${label}</span>`
  }).filter(Boolean).join('')
}

function showResultPopup({ kind, body, deltaHtml, lang, onClose }) {
  const zh = lang !== 'en'
  const root = document.getElementById('modal-root')
  root.innerHTML = ''

  const overlay = document.createElement('div')
  overlay.className = 'result-overlay'

  const box = document.createElement('div')
  box.className = 'result-box'
  box.innerHTML =
    `<div class="result-kind">${escapeHtml(kind)}</div>` +
    `<p class="result-body">${escapeHtml(body)}</p>` +
    (deltaHtml ? `<div class="result-deltas">${deltaHtml}</div>` : '') +
    `<button class="result-btn">${zh ? '继续' : 'Continue'}</button>`

  overlay.appendChild(box)
  root.appendChild(overlay)

  const close = () => {
    root.innerHTML = ''
    document.removeEventListener('keydown', onKey)
    onClose()
  }

  box.querySelector('.result-btn').addEventListener('click', close)
  // clicking outside the box also closes
  overlay.addEventListener('click', e => { if (e.target === overlay) close() })

  const onKey = e => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); close() }
  }
  document.addEventListener('keydown', onKey)
  setTimeout(() => { const btn = box.querySelector('.result-btn'); if (btn) btn.focus() }, 30)
}

// ── Toast notification system ──────────────────────────────────────────────
function showToast(message, type = 'neutral', duration = 2800) {
  const container = document.getElementById('toast-container')
  if (!container) return
  const el = document.createElement('div')
  el.className = `toast${type !== 'neutral' ? ` toast-${type}` : ''}`
  el.textContent = message
  container.appendChild(el)
  setTimeout(() => {
    el.classList.add('toast-leave')
    el.addEventListener('animationend', () => el.remove(), { once: true })
  }, duration)
}

// ── Lab random events ──────────────────────────────────────────────────────
const LAB_EVENTS = [
  // Positive (weight 3)
  {
    weight: 3, good: true,
    text: text('窗外一阵风，烛光摇曳，你忽然想通了一个问题。', 'A draft flickers the candle. Something clicks.'),
    delta: text('💡 灵感 +1', '💡 Insight +1'),
    effect: (s) => { s.insight += 1 }
  },
  {
    weight: 3, good: true,
    text: text('重新整理了桌上的笔记，灵感清晰了许多。', 'Reorganizing your notes, one confusion lifts.'),
    delta: text('✨ 困惑 -1', '✨ Doubt -1'),
    effect: (s) => { s.doubt = Math.max(0, s.doubt - 1) }
  },
  {
    weight: 2, good: true,
    text: text('整理桌面时，发现了一页被压住的旧记录。', 'Under a stack of papers, a forgotten note with a useful observation.'),
    delta: text('📋 记录 +1', '📋 Note +1'),
    effect: (s) => { s.records += 1 }
  },
  // Negative (weight 2)
  {
    weight: 2, good: false,
    text: text('杯子打翻了，水浸湿了一页笔记。', 'A cup tips over and soaks one page of notes.'),
    delta: text('💧 记录 -1', '💧 Note -1'),
    effect: (s) => { s.records = Math.max(0, s.records - 1) }
  },
  {
    weight: 2, good: false,
    text: text('实验结果和预期完全相反，困惑又多了一分。', 'The result is the opposite of what you expected.'),
    delta: text('❓ 困惑 +1', '❓ Doubt +1'),
    effect: (s) => { s.doubt += 1 }
  },
  {
    weight: 1, good: false,
    text: text('搬动了一件沉重的设备，额外消耗了精力。', 'Moving a heavy piece of equipment costs extra effort.'),
    delta: text('😓 精力 -1', '😓 Energy -1'),
    effect: (s) => { s.energy = Math.max(0, s.energy - 1) }
  },
  // Mixed (weight 2)
  {
    weight: 2, good: null,
    text: text('脑子里冒出一个新想法，但还说不清楚。', 'A new idea sparks — but you can\'t quite articulate it yet.'),
    delta: text('🌀 灵感 +1，困惑 +1', '🌀 Insight +1, Doubt +1'),
    effect: (s) => { s.insight += 1; s.doubt += 1 }
  }
]

// ── Resource logic constants ───────────────────────────────────────────────
// Plan B: doubt penalty on rest (per tier)
const DOUBT_REST_PENALTY_MILD = 3   // doubt >= this: -1 energy recovery
const DOUBT_REST_PENALTY_HARD = 5   // doubt >= this: additional -1

// Plan C: low energy suppresses insight
const ENERGY_INSIGHT_THRESHOLD = 2

// Plan D: excess manuscripts → insight (per chapter min records)
const CHAPTER_MIN_RECORDS = [3, 4, 5, 0, 2, 3, 3, 3, 2, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4]
const EXCESS_RECORDS_BONUS = 3  // min records above chapter req to trigger

const LAB_EVENT_CHANCE = 0.20   // 20% per eligible action
const LAB_EVENT_COOLDOWN = 2    // min actions between events
let _lastEventAction = -99

function maybeLabEvent(s, actionIndex, lang) {
  if (actionIndex - _lastEventAction < LAB_EVENT_COOLDOWN) return
  if (Math.random() > LAB_EVENT_CHANCE) return

  const totalWeight = LAB_EVENTS.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight
  let chosen = LAB_EVENTS[LAB_EVENTS.length - 1]
  for (const ev of LAB_EVENTS) {
    roll -= ev.weight
    if (roll <= 0) { chosen = ev; break }
  }

  chosen.effect(s)
  _lastEventAction = actionIndex

  const type = chosen.good === true ? 'event-good' : chosen.good === false ? 'event-bad' : 'neutral'
  const msg = `${pick(chosen.text, lang)}  ${pick(chosen.delta, lang)}`
  setTimeout(() => showToast(msg, type, 3200), 350)
}

// ── Combo tracker ──────────────────────────────────────────────────────────
let _comboCount = 0
let _totalActions = 0  // used as index for event cooldown

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

let _prevResourceValues = {};
let _prevScene = null;

function renderDOM(data) {
  document.body.dataset.lang = data.lang || 'zh';
  const statusBar = document.getElementById('status-bar');
  statusBar.innerHTML = data.resources.map(item => {
    return `
    <div class="resource${item.warning ? ' resource-warning' : ''}" data-key="${escapeHtml(item.key)}" style="cursor:pointer" title="${escapeHtml(item.detail || '')}">
      <span class="resource-label">${escapeHtml(item.label)}</span>
      <span class="resource-value">${escapeHtml(item.value)}${escapeHtml(item.maxText)}</span>
      ${item.sub ? `<span class="resource-sub">${escapeHtml(item.sub)}</span>` : ''}
    </div>`;
  }).join('');

  // Click resource card → show detail modal
  statusBar.querySelectorAll('.resource').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.dataset.key;
      const res = data.resources.find(r => r.key === key);
      if (!res || !res.detail) return;
      showOverlay({
        title: res.label,
        content: res.detail,
        buttons: [{ text: data.lang === 'en' ? 'Got it' : '明白了', primary: true }]
      });
    });
  });

  // Apply flash animation for changed resource values
  data.resources.forEach(item => {
    const prev = _prevResourceValues[item.key];
    const curr = Number(item.value);
    if (prev !== undefined && prev !== curr) {
      const el = statusBar.querySelector(`[data-key="${item.key}"] .resource-value`);
      if (el) {
        el.classList.remove('flash-up', 'flash-down');
        void el.offsetWidth; // force reflow to restart animation
        el.classList.add(curr > prev ? 'flash-up' : 'flash-down');
        el.addEventListener('animationend', () => {
          el.classList.remove('flash-up', 'flash-down');
        }, { once: true });
      }
    }
    _prevResourceValues[item.key] = curr;
  });

  document.getElementById('phaseLabel').textContent = data.phaseLabel || '';
  document.getElementById('langBtn').textContent = data.ui.lang;
  document.getElementById('chapterBtn').textContent = data.lang === 'en' ? 'Chapters' : '章节';
  document.getElementById('resetBtn').textContent = data.ui.reset;
  document.getElementById('title').textContent = data.title || '';
  document.getElementById('scene').textContent = data.scene || '';
  document.getElementById('goal').textContent = data.goal || '';

  // Trigger fade-in animation when scene content changes
  const sceneKey = (data.title || '') + '|' + (data.scene || '');
  if (_prevScene !== null && _prevScene !== sceneKey) {
    const room = document.querySelector('.room');
    if (room) {
      room.classList.remove('scene-enter');
      void room.offsetWidth;
      room.classList.add('scene-enter');
      room.addEventListener('animationend', () => room.classList.remove('scene-enter'), { once: true });
    }
  }
  _prevScene = sceneKey;

  const feedback = document.getElementById('feedback');
  feedback.textContent = data.feedback || '';
  feedback.hidden = !data.feedback;

  const actions = document.getElementById('actions');
  // First-round guidance hint
  const isFirstAction = data.day === 1 && data.chapter === 0 && !data.hasFacts;
  const existingHint = document.getElementById('first-action-hint');
  if (isFirstAction && !existingHint) {
    const hintText = data.lang === 'en'
      ? '🔵 Experiment  🟡 Guess  🟣 Law — start with experiments to gather notes.'
      : '🔵 实验  🟡 猜测  🟣 规律 — 建议先做实验积累记录。';
    actions.insertAdjacentHTML('beforebegin',
      `<p id="first-action-hint" style="font-size:13px;color:#9a917f;margin:0 0 10px;line-height:1.5">${hintText}</p>`);
  } else if (!isFirstAction) {
    existingHint?.remove();
  }

  actions.innerHTML = data.actions.map(item => `
    <button class="action ${item.primary ? 'primary' : ''} ${item.enabled ? '' : 'is-disabled'}" ${item.enabled ? '' : 'disabled'} data-id="${escapeHtml(item.id)}" data-type="${escapeHtml(item.type || '')}">
      <span class="action-main">
        <span class="action-label">${escapeHtml(item.label)}</span>
      </span>
      ${item.locked ? `<span class="cost">${escapeHtml(item.locked)}</span>` : ''}
    </button>
  `).join('');

  document.getElementById('conceptTitle').textContent = data.ui.concepts;
  document.getElementById('logTitle').textContent = data.ui.log;

  const workersPanel = document.getElementById('workers-panel');
  const workers = document.getElementById('workers');
  workersPanel.hidden = !data.workers.length;
  workers.innerHTML = data.workers.map((item, idx) => `
    <div class="worker" data-worker-idx="${idx}">
      <span class="worker-name">${escapeHtml(item.name)}</span>
      <span class="worker-task">${escapeHtml(item.task)}</span>
    </div>
  `).join('');

  const log = document.getElementById('log');
  log.innerHTML = data.logs.map(item => `<div class="log-line">${escapeHtml(item.text)}</div>`).join('');
}


function showDiscoveryTimeline(item, state, lang) {
  const chain = item.chain || []
  const actionOrder = state.actionOrder || []
  const facts = state.facts || {}
  const laws = state.laws || {}

  // Build timeline steps
  const steps = chain.map((actionId) => {
    const action = ACTIONS.find((a) => a.id === actionId)
    const label = action ? pick(action.label, lang) : actionId
    const isTheory = action && action.type === 'theory'
    // Check if step is completed
    let completed = false
    if (isTheory) {
      // Map action ID to law key: law_inertia -> inertia, write_principia -> principia
      let lawKey = actionId
      if (actionId.startsWith('law_')) lawKey = actionId.slice(4)
      else if (actionId === 'write_principia') lawKey = 'principia'
      completed = !!laws[lawKey]
    } else {
      completed = !!facts[actionId]
    }
    // Determine order in player's actual sequence
    const orderIdx = actionOrder.indexOf(actionId)
    return { label, isTheory, completed, orderIdx, actionId }
  })

  // Find the theory definition for this concept
  let theoryDef = ''
  const theoryStep = steps.find((s) => s.isTheory)
  if (theoryStep && THEORY_DEFS[theoryStep.actionId]) {
    theoryDef = pick(THEORY_DEFS[theoryStep.actionId], lang)
  }

  // Build HTML
  let html = '<div class="timeline">'
  steps.forEach((step, i) => {
    const isLast = i === steps.length - 1
    const dotClass = step.completed ? 'tl-dot-done' : 'tl-dot-pending'
    const labelClass = step.completed
      ? (step.isTheory ? 'tl-label-theory' : 'tl-label-done')
      : 'tl-label-pending'
    const orderText = step.completed && step.orderIdx >= 0
      ? `<span class="tl-order">#${step.orderIdx + 1}</span>`
      : ''

    html += `<div class="tl-step">
      <div class="tl-line-col">
        <span class="tl-dot ${dotClass}"></span>
        ${isLast ? '' : '<span class="tl-line"></span>'}
      </div>
      <div class="tl-body">
        <span class="${labelClass}">${escapeHtml(step.label)}</span>
        ${orderText}
      </div>
    </div>`
  })
  html += '</div>'

  if (theoryDef) {
    html += `<div class="tl-definition">${escapeHtml(theoryDef)}</div>`
  }

  showOverlay({
    title: item.name,
    html,
    buttons: [{ text: lang === 'zh' ? '关闭' : 'Close', primary: true }]
  })
}

function boot() {
  if (!miniProgramPage) throw new Error('Game page was not created.');
  const app = miniProgramPage;
  window.physicsDarkRoom = app;
  app.setData = function (nextData) {
    this.data = { ...(this.data || {}), ...nextData };
    renderDOM(this.data);
  };
  document.getElementById('langBtn').addEventListener('click', () => app.switchLanguage());
  document.getElementById('chapterBtn').addEventListener('click', () => app.openChapterSelect());
  document.getElementById('resetBtn').addEventListener('click', () => app.openResetMenu());
  document.getElementById('actions').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button || button.disabled) return;
    app.handleAction({ currentTarget: { dataset: { id: button.dataset.id } } });
  });
  document.getElementById('workers').addEventListener('click', (event) => {
    const worker = event.target.closest('.worker');
    if (!worker) return;
    const idx = parseInt(worker.dataset.workerIdx, 10);
    const item = app.data.workers[idx];
    if (!item) return;
    showDiscoveryTimeline(item, app.state, app.data.lang);
  });
  window.addEventListener('beforeunload', () => app.onHide && app.onHide());
  app.onLoad();
}

document.addEventListener('DOMContentLoaded', boot);
