//Aliases
var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    Graphics = PIXI.Graphics;

//Create a Pixi stage and renderer and add the 
//renderer.view to the DOM
var stage = new Container(),
    renderer = autoDetectRenderer(512, 512);
document.body.appendChild(renderer.view);

loader
  .add("dist/images/treasureHunter.json")
  .load(setup);


//Define variables that might be used in more 
//than one function
var state, explorer, treasure, blobs, chimes, exit, player, dungeon,
    door, healthBar, message, gameScene, gameOverScene, enemies, id;

function setup() {
  //Make the game scene and add it to the stage
  gameScene = new Container();
  stage.addChild(gameScene);

  //Make the sprites and add them to the `gameScene`
  //Create an alias for the texture atlas frame ids
  id = resources["dist/images/treasureHunter.json"].textures;

  //Dungeon
  dungeon = new Sprite(id["dungeon.png"]);
  gameScene.addChild(dungeon);

  //Door
  door = new Sprite(id["door.png"]); 
  door.position.set(32, 0);
  gameScene.addChild(door);

  //Explorer
  explorer = new Sprite(id["explorer.png"]);
  explorer.x = 68;
  explorer.y = gameScene.height / 2 - explorer.height / 2;
  explorer.vx = 0;
  explorer.vy = 0;
  gameScene.addChild(explorer);
  
  //Treasure
  treasure = new Sprite(id["treasure.png"]);
  treasure.x = gameScene.width - treasure.width - 48;
  treasure.y = gameScene.height / 2 - treasure.height / 2;
  gameScene.addChild(treasure);

  // Create blobs
  blobs = [];
  for(var i=0; i<10; i++){
    var blob = createBlob();
    blobs.push(blob);
    gameScene.addChild(blob);  
  }
  

  //Create the health bar
  healthBar = new Container();
  healthBar.position.set(stage.width - 170, 6)
  gameScene.addChild(healthBar);

  //Create the black background rectangle
  var innerBar = new Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(0, 0, 128, 8);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  //Create the front red rectangle
  var outerBar = new Graphics();
  outerBar.beginFill(0xFF3300);
  outerBar.drawRect(0, 0, 128, 8);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;

  //Create the `gameOver` scene
  gameOverScene = new Container();
  stage.addChild(gameOverScene);

  //Make the `gameOver` scene invisible when the game first starts
  gameOverScene.visible = false;

  //Create the text sprite and add it to the `gameOver` scene
  message = new Text(
    "The End!", 
    {font: "64px Futura", fill: "white"}
  );
  message.x = 120;
  message.y = stage.height / 2 - 32;
  gameOverScene.addChild(message);
  
  //Capture the keyboard arrow keys
  captureKeyboard(explorer);
  
  //Set the game state
  state = pause;
 
  //Start the game loop
  gameLoop();
}

function gameLoop(){
  requestAnimationFrame(gameLoop);  
  state();
  renderer.render(stage);
}

function play() {
  // Get y velocity with updatePitch
  updatePitch(explorer);

  // Move explorer
  explorer.x += explorer.vx;
  explorer.y += explorer.vy;

  // Contain explorer inside dungeon
  contain(explorer, {x: 28, y: 10, width: 488, height: 480});
  
  //Set `explorerHit` to `false` before checking for a collision
  var explorerHit = false;

  //Loop through all the sprites in the `enemies` array
  blobs.forEach(function(blob) {
    blob.x += blob.vx;
    
    var blobHitsWall = contain(blob, {x: 28, y: 10, width: 488, height: 480});
    if (blobHitsWall === "left") {
      blob.x = stage.width;
      blob.y = randomInt(0, stage.height - blob.height);
    }

    //Test for a collision. If any of the enemies are touching
    //the explorer, set `explorerHit` to `true`
    if(hitTestRectangle(explorer, blob)) {
      explorerHit = true;
    }
  });

  //If the explorer is hit...
  if(explorerHit) {

    //Make the explorer semi-transparent
    explorer.alpha = 0.5;

    //Reduce the width of the health bar's inner rectangle by 1 pixel
    healthBar.outer.width -= 1;

  } else {

    //Make the explorer fully opaque (non-transparent) if it hasn't been hit
    explorer.alpha = 1;
  }

  //Check for a collision between the explorer and the treasure
  if (hitTestRectangle(explorer, treasure)) {

    //If the treasure is touching the explorer, center it over the explorer
    treasure.x = explorer.x + 8;
    treasure.y = explorer.y + 8;
  }

  //Does the explorer have enough health? If the width of the `innerBar`
  //is less than zero, end the game and display "You lost!"
  if (healthBar.outer.width < 0) {
    state = end;
    message.text = "You lost!";
  }

  //If the explorer has brought the treasure to the exit,
  //end the game and display "You won!"
  if (hitTestRectangle(treasure, door)) {
    state = end;
    message.text = "You won!";
  } 
}

function createBlob()
{
  //Make a blob
  var blob = new Sprite(id["blob.png"]);

  //Set the blob's position
  blob.x = randomInt(0, stage.width - blob.width);
  blob.y = randomInt(0, stage.height - blob.height);

  // Set blob velocity
  var speed = 2;
  var direction = -1;
  blob.vx = speed * direction;

  return blob;
}

function pause()
{
  explorer.vx = 0;
  explorer.vy = 0;
  explorer.x = 68;
  explorer.y = gameScene.height / 2 - explorer.height / 2;
}

function end() 
{
  gameScene.visible = false;
  gameOverScene.visible = true;
}
