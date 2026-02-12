extends Area2D
# Spike hazard - player touches and loses a life

func _ready():
	body_entered.connect(_on_body_entered)

func _on_body_entered(body):
	if body.is_in_group("player"):
		body.lose_life()
