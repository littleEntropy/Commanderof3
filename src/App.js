import logo from "./logo.svg";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Row, Col, ListGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "mtg-card-seer";
const COMMANDER = 0;
const PARTNER = 1;
const BACKGROUND = 2;
const CARD_99 = 3;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function getTemplate(decksize) {
  console.log("gettemplate");
  const response = await axios.get("/cardprop");
  const propfile = response.data;
  const lines = propfile.split("\n");
  let result = [];
  for (const line of lines) {
    const [template, count] = line.split(",");
    const parts = template.split(":");
    let entry = template;
    if (parts.length > 1) {
      entry = { attr: parts[0], value: parts[1] };
    }
    result = result.concat(Array(+count).fill(entry));
  }
  result = result
    .concat(Array(decksize - result.length).fill("any"))
    .filter((x) => x !== "basic");
  console.log(result);
  return result;
}
function App() {
  const [deck, setDeck] = useState([]);
  const [choice, setChoice] = useState([]);
  const [category, setCategory] = useState(0);
  const [colourID, setColourID] = useState([]);
  const [queue, setQueue] = useState([]);
  const [chosenCommander, setChosenCommander] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  useEffect(() => {
    async function fetchdata() {
      if (deck.length == 0) {
        const cards = [];
        for (let i = 0; i < 3; ++i) {
          const result = await axios.get(
            "https://api.scryfall.com/cards/random?q=is%3Acommander+year>2008+f%3Aedh+-is%3adfc"
          );
          cards.push(result.data);
        }
        console.log(cards);
        setChoice(cards);
      } else {
        async function GetCard(template) {
          let url =
            "https://api.scryfall.com/cards/random?q=id%3A" +
            colourID.join("") +
            "+year>2008+f%3Aedh+-is%3adfc+is%3Aspell";
          if ("attr" in template) {
            if (template.attr === "edhrec") {
            } else {
              url =
                "https://api.scryfall.com/cards/random?q=id%3A" +
                colourID.join("") +
                "+year>2008+f%3Aedh+-is%3adfc+is%3Aspell+" +
                template.attr +
                "%3a" +
                template.value;
            }
            const result = await axios.get(url);
            console.log(result.data);
            return result.data;
          }
        }
        const template = await getTemplate(100 - deck.length);
        for (const entry of template) {
          for (let i = 0; i < 3; ++i) {
            const card = await GetCard(entry);
            setQueue([...queue, card]);
            await sleep(150);
          }
        }
      }
    }
    fetchdata();
  }, [chosenCommander]);
  useEffect(() => {
    if (choice.length < 3 && queue.length > queueIndex) {
      console.log("useEffect");
      setChoice([...choice, queue[queueIndex]]);
      setQueueIndex(queueIndex + 1);
    }
  }, [choice, queue, queueIndex]);
  async function MakeChoice(i) {
    if (deck.length > 0) {
      const newDeck = [...deck, choice[i]];
      setDeck(newDeck);
      console.log(deck);
    } else {
      const ispartner = /^Partner/m;
      const partnerwith = /^Partner with/m;
      const hasbackground = /^Choose a Background/m;
      const card = choice[i];
      setColourID(card.color_identity);
      let partner = null;
      if (
        ispartner.test(card.oracle_text) &&
        !partnerwith.test(card.oracle_text)
      ) {
        partner = await axios.get(
          "https://api.scryfall.com/cards/random?q=otag%3Apartner+year>2008+f%3Aedh+-is%3adfc"
        );
      } else if (hasbackground.test(card.oracle_text)) {
        partner = await axios.get(
          "https://api.scryfall.com/cards/random?q=t%3Abackground+year>2008+f%3Aedh+-is%3adfc"
        );
      }
      const newDeck = [...deck, choice[i]];
      if (partner) {
        partner = partner.data;
        console.log(partner);
        setColourID([...new Set([...colourID, ...card.color_identity])]);
        newDeck.push(partner);
      }
      console.log("settingdeck");
      setDeck(newDeck);
      setChosenCommander(true);
    }
    setChoice([]);
  }
  return (
    <div className="App">
      <Row>
        {" "}
        <Col>
          {" "}
          <Row>
            {choice.map((choice, i) => {
              return (
                <Col key={i.toString()}>
                  <img
                    onClick={() => {
                      MakeChoice(i);
                    }}
                    className="img-fluid"
                    src={choice.image_uris.normal}
                  ></img>
                </Col>
              );
            })}
          </Row>
        </Col>
        <Col xs="3">
          <ListGroup>
            {deck.map((card, i) => {
              return (
                <ListGroup.Item>
                  <card-link name={card.name}>{card.name}</card-link>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </Col>
      </Row>
    </div>
  );
}

export default App;
