import { NeverHaveIEverMatch } from "../../models/NeverHaveIEver/neverHaveIEver.model.js";

// 1. Join waiting room
export const joinWaitingRoom = async (req, res) => {
  const userId = req.user._id;
  const { groupSize } = req.body;

  try {
    let match = await NeverHaveIEverMatch.findOne({
      groupSize,
      status: "waiting",
    });

    if (!match) {
      match = new NeverHaveIEverMatch({
        groupSize,
        participants: [userId],
        status: "waiting",
      });
    } else {
      if (!match.participants.includes(userId)) {
        match.participants.push(userId);
      }
    }

    if (match.participants.length === groupSize) {
      match.status = "in_progress";
      const randomIndex = Math.floor(Math.random() * groupSize);
      match.chanceIndex = randomIndex;
    }

    await match.save();
    console.log("🧠 joining match with userId:", userId);
    console.log("🔢 current participants:", match.participants);

    res.json({ success: true, matchId: match._id });
  } catch (err) {
    console.error("Error joining waiting room:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 2. Get waiting room status
export const getWaitingRoomStatus = async (req, res) => {
  const userId = req.user._id;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: { $in: ["waiting", "in_progress"] },
    });

    if (!match) {
      return res.status(404).json({ error: "No active match found" });
    }

    res.json({
      playersJoined: match.participants.length,
      requiredPlayers: match.groupSize,
      readyToStart: match.status === "in_progress",
    });
  } catch (err) {
    console.error("Error fetching waiting status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// 3. Submit prompt by chance holder
export const submitPrompt = async (req, res) => {
  const userId = req.user._id;
  const { prompt } = req.body;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: "in_progress",
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const currentHolder = match.participants[match.chanceIndex];

    if (currentHolder.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not your turn" });
    }

    match.currentPrompt = {
      text: prompt,
      answers: [],
      createdAt: new Date(),
    };

    await match.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Error submitting prompt:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getCurrentTurn = async (req, res) => {
  const userId = req.user._id;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: 'in_progress'
    });

    if (!match) {
      return res.status(404).json({ error: 'No active match found' });
    }

    const currentChanceHolder = match.participants[match.chanceIndex];

    res.json({
      userId,
      chanceHolderId: currentChanceHolder
    });
  } catch (err) {
    console.error("Failed to get current turn:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// 4. Get prompt status (for non-holders to know if prompt is ready)
export const getPromptStatus = async (req, res) => {
  const userId = req.user._id;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: "in_progress",
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const promptReady = !!match.currentPrompt?.text;

    res.json({ promptReady });
  } catch (err) {
    console.error("Error fetching prompt status:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const submitAnswer = async (req, res) => {
  const userId = req.user._id;
  const { response } = req.body;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: "in_progress",
    });

    if (!match || !match.currentPrompt) {
      return res.status(404).json({ error: "No active prompt found" });
    }

    const alreadyAnswered = match.currentPrompt.answers.find(
      (a) => a.userId.toString() === userId.toString()
    );

    if (alreadyAnswered) {
      return res
        .status(400)
        .json({ error: "You already submitted your answer" });
    }

    match.currentPrompt.answers.push({ userId, response });
    await match.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Submit answer error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAnswers = async (req, res) => {
  const userId = req.user._id;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: "in_progress",
    }).populate("currentPrompt.answers.userId", "fullName avatar1");

    if (!match || !match.currentPrompt) {
      return res.status(404).json({ error: "No current prompt found" });
    }

    const totalExpected = match.groupSize - 1; // excluding chance holder
    const answersGiven = match.currentPrompt.answers.length;

    if (answersGiven < totalExpected) {
      return res.json({ allAnswered: false });
    }

    res.json({
      allAnswered: true,
      prompt: match.currentPrompt.text,
      answers: match.currentPrompt.answers.map((ans) => ({
        userId: ans.userId._id,
        name: ans.userId.fullName,
        avatar: ans.userId.avatar1,
        response: ans.response,
      })),
    });
  } catch (err) {
    console.error("Get answers error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const nextTurn = async (req, res) => {
  const userId = req.user._id;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: "in_progress",
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const totalPlayers = match.participants.length;
    match.chanceIndex = (match.chanceIndex + 1) % totalPlayers;
    match.currentPrompt = undefined;

    await match.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Next turn error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getWaitingCounts = async (req, res) => {
  //global waiting count for 2,3,4 waiting list
  try {
    const allMatches = await NeverHaveIEverMatch.find({ status: "waiting" });

    const waitingCounts = { 2: 0, 3: 0, 4: 0 };

    for (const match of allMatches) {
      const count = match.participants.length;
      const size = match.groupSize;
      if (waitingCounts[size] !== undefined) {
        waitingCounts[size] += count;
      }
    }

    res.json({ waitingCounts });
  } catch (err) {
    console.error("Error getting waiting counts:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const leaveWaitingRoom = async (req, res) => {
  const userId = req.user._id;

  try {
    const match = await NeverHaveIEverMatch.findOne({
      participants: userId,
      status: { $in: ["waiting", "in_progress"] },
    });

    if (!match) {
      return res.status(404).json({ error: "No active match found" });
    }

    // Remove player
    match.participants = match.participants.filter(
      (id) => id.toString() !== userId.toString()
    );

    // ⬇️ If players drop below required groupSize, move back to waiting
    if (match.participants.length < match.groupSize) {
      match.status = "waiting";
      match.currentPrompt = undefined;
      match.chanceIndex = 0; // or preserve it
    }

    await match.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Error during leave:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const cleanupEmptyWaitingRooms = async () => {
  //remove waiting list if empty for 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  try {
    const result = await NeverHaveIEverMatch.deleteMany({
      status: "waiting",
      participants: { $size: 0 },
      createdAt: { $lt: fiveMinutesAgo },
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Deleted ${result.deletedCount} empty waiting room(s)`);
    }
  } catch (err) {
    console.error("❌ Error cleaning up empty waiting rooms:", err);
  }
};
